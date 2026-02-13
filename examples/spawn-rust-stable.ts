
import { buildRustApp, RUST_PROJECT_DIR, BINARY_REL_PATH } from "./rust-utils";
import { ProcessManager } from "../src/core/ProcessManager";
import { type ProcessConfig, ProcessStateValues } from "../src/core/types";
import path from "path";

/**
 * Example 2: Demonstrate a stable Rust process that doesn't crash.
 */

const STABLE_CONFIG = {
    APP_NAME: "rust-stable-test",
    PORT: 8089,
    MAX_RESTARTS: 5,
    MIN_UPTIME: 5000, 
    RESTART_DELAY: 1000, 
    TEST_DURATION: 10000, // Run for 10 seconds
} as const;

async function main() {
    console.log("=== Example 2: Rust Stable App Test ===");
    
    if (!buildRustApp()) process.exit(1);

    const executablePath = path.join(process.cwd(), RUST_PROJECT_DIR, BINARY_REL_PATH);
    const manager = new ProcessManager();
    console.log("🚀 Starting Process Manager...");

    const stableConfig: ProcessConfig = {
        name: STABLE_CONFIG.APP_NAME,
        script: executablePath,
        instances: 1,
        maxRestarts: STABLE_CONFIG.MAX_RESTARTS,
        minUptime: STABLE_CONFIG.MIN_UPTIME,
        restartDelay: STABLE_CONFIG.RESTART_DELAY,
        autorestart: true,
        env: {
            RUST_LOG: "info",
            PORT: STABLE_CONFIG.PORT.toString(),
            ENABLE_CRASH: "false" // Disable crash logic
        }
    };

    try {
        manager.addProcess(stableConfig);
        await manager.startProcess(stableConfig.name);
        console.log("✅ Process started and stable.");
        
        console.log(`⏱️  Monitoring for ${STABLE_CONFIG.TEST_DURATION / 1000} seconds...`);
        
        // Wait and check periodically
        const interval = setInterval(async () => {
            const proc = manager.getProcess(STABLE_CONFIG.APP_NAME);
            if (proc) {
                const status = proc.getStatus();
                console.log(`[Status] State: ${status.state} | Uptime: ${(status.uptime || 0)/1000}s | Restarts: ${status.restartCount}`);
                
                // Test endpoint
                try {
                    const res = await fetch(`http://localhost:${STABLE_CONFIG.PORT}`);
                    if (res.ok) {
                         // console.log("   Verify: Endpoint healthy");
                    }
                } catch(e) {
                    console.warn("   Verify: Endpoint unreachable!");
                }
            }
        }, 2000);

        await new Promise(r => setTimeout(r, STABLE_CONFIG.TEST_DURATION));
        clearInterval(interval);
        
        const endProc = manager.getProcess(STABLE_CONFIG.APP_NAME);
        if (endProc) {
            const status = endProc.getStatus();
            
            if (status.state === ProcessStateValues.RUNNING && (status.restartCount || 0) === 0) {
                 console.log("\n✅ SUCCESS: Process ran stable with 0 restarts.");
            } else {
                 console.log(`\n❌ FAILED: Status was ${status.state} with ${status.restartCount} restarts.`);
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        console.log("🛑 Cleaning up...");
        manager.stopAll();
    }
}

main().catch(console.error);
