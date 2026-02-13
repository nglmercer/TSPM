
import { buildRustApp, RUST_PROJECT_DIR, BINARY_REL_PATH } from "./rust-utils";
import { ProcessManager } from "../src/core/ProcessManager";
import { type ProcessConfig, ProcessStateValues } from "../src/core/types";
import path from "path";

/**
 * Example 3: Demonstrate High Availability with Multiple Instances
 * 
 * This example:
 * 1. Spawns 3 instances of the Rust application
 * 2. Crashes one instance intentionally via request
 * 3. Verifies that the service remains available via other instances (simulated request)
 * 4. Verifies that the crashed instance is restarted
 */

const CLUSTER_CONFIG = {
    APP_NAME: "rust-cluster-test",
    BASE_PORT: 8090, 
    INSTANCES: 3,
    MAX_RESTARTS: 5,
    RESTART_DELAY: 1500,
} as const;

async function main() {
    console.log("=== Example 3: Rust Cluster High Availability Test ===");
    
    if (!buildRustApp()) process.exit(1);

    const executablePath = path.join(process.cwd(), RUST_PROJECT_DIR, BINARY_REL_PATH);
    const manager = new ProcessManager();
    console.log("🚀 Starting Process Manager...");

    // Configure process for clustering (3 instances)
    // The updated Rust app now adds NODE_APP_INSTANCE env var (0, 1, 2) to the BASE_PORT
    
    const clusterConfig: ProcessConfig = {
        name: CLUSTER_CONFIG.APP_NAME,
        script: executablePath,
        instances: CLUSTER_CONFIG.INSTANCES,
        maxRestarts: CLUSTER_CONFIG.MAX_RESTARTS,
        minUptime: 2000,
        restartDelay: CLUSTER_CONFIG.RESTART_DELAY,
        autorestart: true,
        env: {
            RUST_LOG: "info",
            PORT: CLUSTER_CONFIG.BASE_PORT.toString(), 
            ENABLE_CRASH: "true" // Enable crash on request
        }
    };

    console.log(`📝 Configuring ${CLUSTER_CONFIG.INSTANCES} instances starting at port ${CLUSTER_CONFIG.BASE_PORT}...`);

    try {
        manager.addProcess(clusterConfig);
        await manager.startProcess(clusterConfig.name);
        
        console.log(`✅ Started process group '${CLUSTER_CONFIG.APP_NAME}'. Waiting for startup...`);
        await new Promise(r => setTimeout(r, 2000));
        
        // 1. Check all instances are running
        const processes = manager.getProcessesByBaseName(CLUSTER_CONFIG.APP_NAME);
        const running = processes.filter(p => p.getStatus().state === ProcessStateValues.RUNNING);
        console.log(`📊 Cluster Status: ${running.length}/${CLUSTER_CONFIG.INSTANCES} instances running.`);
        
        if (running.length !== CLUSTER_CONFIG.INSTANCES) {
             console.error("❌ Failed to start all instances! Aborting test.");
             manager.stopAll();
             process.exit(1);
        }

        // 2. Target Instance 1 (port 8091) to crash
        const victimIndex = 1;
        const victimPort = CLUSTER_CONFIG.BASE_PORT + victimIndex;
        console.log(`🎯 Targeting Instance ${victimIndex} on port ${victimPort} for crash test...`);
        
        try {
            console.log(`   Sending crash request to http://localhost:${victimPort}/crash...`);
            await fetch(`http://localhost:${victimPort}/crash`);
        } catch (e) {
            console.log("   Request sent (connection closed as expected).");
        }
        
        // Wait briefly for crash
        await new Promise(r => setTimeout(r, 800));
        
        // 3. Verify availability of OTHER instances
        console.log("🔍 Verifying availability of other instances...");
        const survivorIndex = 0; // Instance 0 (port 8090)
        const survivorPort = CLUSTER_CONFIG.BASE_PORT + survivorIndex;
        
        try {
            const res = await fetch(`http://localhost:${survivorPort}`);
            if (res.ok) {
                console.log(`✅ Instance ${survivorIndex} (Survivor) is UP and responding.`);
            } else {
                console.warn(`⚠️ Instance ${survivorIndex} returned status ${res.status}`);
            }
        } catch (e) {
             console.error(`❌ Instance ${survivorIndex} error:`,{e});
        }

        // 4. Check Victim Status
        const victimProc = processes.find(p => p.getInstanceId() === victimIndex);
        if (victimProc) {
            const status = victimProc.getStatus();
            console.log(`💀 Victim Instance Status: ${status.state} (Restarts: ${status.restartCount})`);
            
            if (status.state === ProcessStateValues.RESTARTING || (status.restartCount || 0) > 0) {
                 console.log("✅ Victim instance detected crash/restart logic.");
            }
        }
        
        // 5. Wait for recovery
        console.log(`⏳ Waiting ${CLUSTER_CONFIG.RESTART_DELAY}ms for auto-recovery...`);
        await new Promise(r => setTimeout(r, CLUSTER_CONFIG.RESTART_DELAY + 1000));
        
        if (victimProc) {
            const finalStatus = victimProc.getStatus();
            if (finalStatus.state === ProcessStateValues.RUNNING) {
                console.log(`✅ RECOVERY SUCCESS: Victim instance is back ONLINE (PID: ${finalStatus.pid}).`);
            } else {
                console.error(`❌ RECOVERY FAILED: Victim instance is ${finalStatus.state}.`);
            }
        }

        console.log("\n✅ HA TEST COMPLETED.");
        manager.stopAll();
        
    } catch (error) {
        console.error("❌ Test Error:", error);
        manager.stopAll();
        process.exit(1);
    }
}

main().catch(console.error);
