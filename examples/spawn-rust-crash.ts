
import { buildRustApp, RUST_PROJECT_DIR, BINARY_REL_PATH } from "./rust-utils";
import { ProcessManager } from "../src/core/ProcessManager";
import { type ProcessConfig, ProcessStateValues } from "../src/core/types";
import path from "path";

/**
 * Example 1: Demonstrate a process that crashes and reaches maxRestarts limit.
 */

const TEST_CONFIG = {
    APP_NAME: "rust-crash-test",
    PORT: 8081,
    MAX_RESTARTS: 3,
    MIN_UPTIME: 100, // Short uptime to allow quick crash testing
    RESTART_DELAY: 1000, 
    MAX_TEST_ATTEMPTS: 20, 
    CRASH_URL: "http://localhost:8081",
} as const;

enum TestResult {
    PASSED = "PASSED",
    FAILED = "FAILED",
    IN_PROGRESS = "IN_PROGRESS"
}

async function triggerCrash(): Promise<void> {
    try {
        console.log(`💥 Sending request to ${TEST_CONFIG.CRASH_URL} to trigger crash...`);
        await fetch(TEST_CONFIG.CRASH_URL);
    } catch (e) {
        // Expected
    }
}

async function main() {
    console.log("=== Example 1: Rust App Crash Test ===");
    
    if (!buildRustApp()) process.exit(1);

    const executablePath = path.join(process.cwd(), RUST_PROJECT_DIR, BINARY_REL_PATH);
    const manager = new ProcessManager();
    console.log("🚀 Starting Process Manager...");

    const crashConfig: ProcessConfig = {
        name: TEST_CONFIG.APP_NAME,
        script: executablePath,
        instances: 1,
        maxRestarts: TEST_CONFIG.MAX_RESTARTS,
        minUptime: TEST_CONFIG.MIN_UPTIME,
        restartDelay: TEST_CONFIG.RESTART_DELAY,
        autorestart: true,
        env: {
            RUST_LOG: "info",
            PORT: TEST_CONFIG.PORT.toString(),
            ENABLE_CRASH: "true" // Enable crash via ENV
        }
    };

    try {
        manager.addProcess(crashConfig);
        await manager.startProcess(crashConfig.name);
        console.log("✅ Process started. Watching for restarts...");
        
        // Loop to monitor
        let attempts = 0;
        let result = TestResult.IN_PROGRESS;

        while (attempts < TEST_CONFIG.MAX_TEST_ATTEMPTS) {
            attempts++;
            const proc = manager.getProcess(TEST_CONFIG.APP_NAME);
            if (!proc) break;
            
            const status = proc.getStatus();
            const restarts = status.restartCount || 0;
            
            console.log(`[Loop ${attempts}] State: ${status.state?.toUpperCase()} | Restarts: ${restarts}/${TEST_CONFIG.MAX_RESTARTS}`);

            if (restarts >= TEST_CONFIG.MAX_RESTARTS) {
                if (status.state === ProcessStateValues.ERRORED || status.state === ProcessStateValues.STOPPED) {
                    console.log(`\n✨ Success: Process stopped restarting after ${restarts} attempts.`);
                    result = TestResult.PASSED;
                    break;
                }
            }

            if (status.state === ProcessStateValues.RUNNING) {
                await triggerCrash();
                await new Promise(r => setTimeout(r, TEST_CONFIG.RESTART_DELAY + 500));
            } else {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        console.log("\n" + "=".repeat(30));
        if (result === TestResult.PASSED) {
            console.log("✅ TEST PASSED: Max restart limit respected.");
        } else {
            console.log("❌ TEST FAILED: Process did not stop as expected.");
        }
        console.log("=".repeat(30) + "\n");

        manager.stopAll();
        
    } catch (error) {
        console.error("❌ Error:", error);
        manager.stopAll();
        process.exit(1);
    }
}

main().catch(console.error);
