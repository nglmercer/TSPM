import { ProcessManager } from "../../core/ProcessManager";
import { startApi } from "../../utils/api";
import { log } from "../../utils/logger";
import { APP_CONSTANTS } from "../../utils/config/constants";

/**
 * Web command - Starts the TSPM Web Dashboard
 */
export function webCommand(options: { port?: number; host?: string }): void {
  log.info(`${APP_CONSTANTS.LOG_PREFIX} Initializing Web Dashboard...`);
  
  const manager = new ProcessManager();
  
  // Start monitoring so we have stats
  manager.startMonitoring();
  
  startApi(manager, {
    enabled: true,
    port: options.port || 3000,
    host: options.host || '0.0.0.0',
    dashboard: true
  });
  
  log.success(`${APP_CONSTANTS.LOG_PREFIX} Web Dashboard is running.`);
}
