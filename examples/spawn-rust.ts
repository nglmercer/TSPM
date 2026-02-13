
import { spawnSync } from "bun";
import path from "path";
import { ProcessManager } from "../src/core/ProcessManager";
import { type ProcessConfig, ProcessStateValues } from "../src/core/types";

/**
 * Configuration constants for the Rust crash test example.
 * Using constants makes the code more maintainable and easier to tweak.
 */
const TEST_CONFIG = {
    APP_NAME: "rust-crash-test",
    PORT: 8080,
    MAX_RESTARTS: 3,
    MIN_UPTIME: 100, // Short uptime to allow quick crash testing
    RESTART_DELAY: 1000, // 1 second delay between restarts
    MAX_TEST_ATTEMPTS: 15, // Max number of loops to check status
    CRASH_URL: "http://localhost:8080",
    RUST_PROJECT_DIR: "examples/applications/rust-crash",
    BINARY_REL_PATH: "target/release/rust-crash-app"
} as const;

/**
 * Enum for specific test outcomes to make logic explicit
 */
enum TestResult {
    PASSED = "PASSED",
    FAILED = "FAILED",
    IN_PROGRESS = "IN_PROGRESS"
}

/**
 * Helper to build the Rust application
 */
function buildRustApp(): boolean {
    console.log("🛠️  Compiling Rust application...");
    
    // Check for cargo
    try {
        const check = spawnSync(["cargo", "--version"]);
        if (check.exitCode !== 0) throw new Error("Cargo not found");
    } catch {
        console.error("Cargo (Rust package manager) not found. Please install Rust to run this example.");
        return false;
    }

    const rustProject = path.join(process.cwd(), TEST_CONFIG.RUST_PROJECT_DIR);
    
    // Build release binary
    const build = spawnSync(["cargo", "build", "--release"], {
        cwd: rustProject,
        stdio: ["ignore", "inherit", "inherit"]
    });

    if (build.exitCode !== 0) {
        console.error("Failed to build Rust application. Check compiler output above.");
        return false;
    }

    console.log("Rust application built successfully.");
    return true;
}

/**
 * Helper to trigger the intentional crash endpoint
 */
async function triggerCrash(): Promise<void> {
    try {
        console.log(`Sending request to ${TEST_CONFIG.CRASH_URL} to trigger crash...`);
        await fetch(TEST_CONFIG.CRASH_URL);
    } catch (e) {
        // We expect the request to fail or hang because the server crashes immediately
        // so we don't treat this as an error
    }
}

async function main() {
    // 1. Build the application
    if (!buildRustApp()) process.exit(1);

    const executablePath = path.join(
        process.cwd(), 
        TEST_CONFIG.RUST_PROJECT_DIR, 
        TEST_CONFIG.BINARY_REL_PATH
    );
    
    // 2. Configure the process manager
    const manager = new ProcessManager();
    console.log("Starting Process Manager...");

    // Define process configuration
    const rustProcessConfig: ProcessConfig = {
        name: TEST_CONFIG.APP_NAME,
        script: executablePath,
        instances: 1,
        // Critical settings for this test:
        maxRestarts: TEST_CONFIG.MAX_RESTARTS,
        minUptime: TEST_CONFIG.MIN_UPTIME,
        restartDelay: TEST_CONFIG.RESTART_DELAY,
        autorestart: true,
        env: {
            RUST_LOG: "info",
            PORT: TEST_CONFIG.PORT.toString()
        }
    };

    console.log(`📝 Configuring process '${TEST_CONFIG.APP_NAME}' to restart max ${TEST_CONFIG.MAX_RESTARTS} times.`);

    try {
        // 3. Start the process
        manager.addProcess(rustProcessConfig);
        await manager.startProcess(rustProcessConfig.name);
        console.log("✅ Process started initially.");
        
        // 4. Loop to monitor and force crashes until maxRestarts is reached
        let attempts = 0;
        let result = TestResult.IN_PROGRESS;

        console.log("👀 watching lifecycle events...");

        while (attempts < TEST_CONFIG.MAX_TEST_ATTEMPTS) {
            attempts++;
            const process = manager.getProcess(TEST_CONFIG.APP_NAME);
            
            if (!process) {
                console.error("Process vanished from registry!");
                result = TestResult.FAILED;
                break;
            }
            
            const status = process.getStatus();
            const currentRestarts = status.restartCount || 0;
            
            console.log(`[Attempt ${attempts}] State: ${status.state?.toUpperCase()} | Restarts: ${currentRestarts}/${TEST_CONFIG.MAX_RESTARTS}`);

            // CHECK: Have we reached the target state (Errored/Stopped after max restarts)?
            if (currentRestarts >= TEST_CONFIG.MAX_RESTARTS) {
                if (status.state === ProcessStateValues.ERRORED || status.state === ProcessStateValues.STOPPED) {
                    console.log(`\nSuccess: Process stopped restarting after ${currentRestarts} attempts.`);
                    result = TestResult.PASSED;
                    break;
                }
            }

            // ACTION: If running, crash it again
            if (status.state === ProcessStateValues.RUNNING) {
                await triggerCrash();
                // Wait longer than restart delay to ensure transition happens
                await new Promise(r => setTimeout(r, TEST_CONFIG.RESTART_DELAY + 500));
            } else {
                // Wait for restart logic to kick in
                await new Promise(r => setTimeout(r, 500));
            }
        }

        // 5. Final Report
        console.log("\n" + "=".repeat(30));
        if (result === TestResult.PASSED) {
            console.log("TEST PASSED: Max restart limit respected.");
        } else {
            console.log("TEST FAILED: Process did not reach expected state.");
            console.log(`Reason: Timeout or incorrect state. Attempts: ${attempts}`);
        }
        console.log("=".repeat(30) + "\n");

        // Cleanup
        console.log("Cleaning up...");
        await manager.stopAll();
        
    } catch (error) {
        console.error("Unexpected error:", error);
        await manager.stopAll();
        process.exit(1);
    }
}

main().catch(console.error);
