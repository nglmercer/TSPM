import { ConfigLoader, ProcessManager, ConfigValidationError } from "./src/core";

async function main() {
  const arg = process.argv[2];

  // Handle 'init' command
  if (arg === "init") {
    const format = (process.argv[3] as "yaml" | "json") || "yaml";
    try {
      await ConfigLoader.init({ format });
      console.log("[TSPM] Workspace initialized successfully.");
    } catch (error) {
      console.error(`[TSPM] Failed to initialize: ${error}`);
      process.exit(1);
    }
    return;
  }

  const configPath = arg || "tspm.yaml";
  
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
    if (error instanceof ConfigValidationError) {
      console.error(`[TSPM] Configuration validation failed:`);
      error.validation.errors.forEach(err => {
        console.error(`  - ${err.field}: ${err.message}`);
      });
    } else {
      console.error(`[TSPM] Failed to start: ${error}`);
    }
    process.exit(1);
  }
}

main();