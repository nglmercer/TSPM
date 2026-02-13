
import { spawnSync } from "bun";
import { ProcessManager } from "../src/core/ProcessManager";
import { type ProcessConfig } from "../src/core/types";
import path from "path";

async function main() {
    console.log("🛠️  Compiling Rust application...");
    
    // Check if cargo exists
    try {
        const check = spawnSync(["cargo", "--version"]);
        if (check.exitCode !== 0) {
            console.error("❌ Cargo not found. Please install Rust.");
            process.exit(1);
        }
    } catch (e) {
        console.error("❌ Cargo not found. Please install Rust.");
        process.exit(1);
    }

    // Build the Rust app
    const rustProject = path.join(process.cwd(), "examples/applications/rust-crash");
    const build = spawnSync(["cargo", "build", "--release"], {
        cwd: rustProject,
        stdio: ["ignore", "inherit", "inherit"]
    });

    if (build.exitCode !== 0) {
        console.error("❌ Failed to build Rust application");
        process.exit(1);
    }

    console.log("✅ Rust application built successfully");

    const executable = path.join(rustProject, "target/release/rust-crash-app");
    
    // Configure Process Manager
    const manager = new ProcessManager();
    console.log("🚀 Starting Process Manager...");

    const rustConfig: ProcessConfig = {
        name: "rust-crash-test",
        script: executable,
        instances: 1,
        maxRestarts: 3, // Max 3 restarts before giving up
        minUptime: 100, // Very short for testing crash loop quickly
        restartDelay: 1000, 
        
        // Ensure restart policy is set
        autorestart: true,
        
        // Environment
        env: {
            RUST_LOG: "info"
        }
    };

    console.log(`📝 Configuring process '${rustConfig.name}' with maxRestarts=${rustConfig.maxRestarts}`);

    try {
        manager.addProcess(rustConfig);
        await manager.startProcess(rustConfig.name);
        console.log("✅ Process started.");
        
        // Loop to crash it until it stops
        let maxAttempts = 10;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const proc = manager.getProcess("rust-crash-test");
            if (!proc) break;
            
            const status = proc.getStatus();
            console.log(`Current State: ${status.state}, Restarts: ${status.restartCount}`);

            if (status.state === "errored" || (status.restartCount || 0) >= 3) {
                 if (status.state === "errored" || status.state === "stopped") {
                    console.log("✅ Process entered errored/stopped state as expected!");
                    break;
                 } else {
                    // It might be running but hit max restarts? No, if it hit max restarts it should be errored/stopped.
                    // If it is running, we need to crash it one more time.
                 }
            }
            
            if (status.state === "running") {
                 console.log("💥 Process is running, sending crash request...");
                 try {
                     const res = await fetch("http://localhost:8080");
                     console.log("Triggered crash endpoint.");
                 } catch (e) {
                     // Expected
                 }
                 // Wait a bit for restart to happen
                 await new Promise(r => setTimeout(r, 1500));
            } else {
                 // Wait for it to come up
                 await new Promise(r => setTimeout(r, 500));
            }
            attempts++;
        }

        const proc = manager.getProcess("rust-crash-test");
        if (proc) {
            const status = proc.getStatus();
            console.log(`\nFinal Status: ${status.state}`);
            console.log(`Restarts: ${status.restartCount}`);
            
            if (status.state === "stopped" || status.state === "errored") {
                console.log("✅ Test Passed: Process stopped after max restarts.");
            } else {
                console.log("⚠️ Process is still running? It might not have crashed enough times or backoff is too long.");
            }
        }


        // Cleanup
        console.log("\n🛑 Stopping all processes...");
        await manager.stopAll();
        
    } catch (error) {
        console.error("❌ Error in example:", error);
        await manager.stopAll();
    }
}

main().catch(console.error);
