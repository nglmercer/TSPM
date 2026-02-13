import { ConfigLoader } from "./src/core/Config";
import { ProcessManager } from "./src/core/ProcessManager";

async function main() {
  const configPath = process.argv[2] || "tspm.yaml";
  
  console.log(`[TSPM] Loading config from ${configPath}...`);
  
  try {
    const config = await ConfigLoader.load(configPath);
    const manager = new ProcessManager();
    
    for (const procConfig of config.processes) {
      manager.addProcess(procConfig);
    }
    
    await manager.startAll();
    
    console.log("[TSPM] All processes started.");

    // Handle signals for graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n[TSPM] Shutting down...");
      manager.stopAll();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\n[TSPM] Shutting down...");
      manager.stopAll();
      process.exit(0);
    });

  } catch (error) {
    console.error(`[TSPM] Failed to start: ${error}`);
    process.exit(1);
  }
}

main();