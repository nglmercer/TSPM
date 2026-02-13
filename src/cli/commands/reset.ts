import { log } from '../../utils/logger';
import { readProcessStatus, writeProcessStatus } from '../state/status';
import { EXIT_CODES, APP_CONSTANTS } from '../../utils/config/constants';

/**
 * Reset command - Reset process restart counters and metrics
 * 
 * This command resets the restart counter for one or all processes.
 * Similar to PM2's reset command.
 */
export function resetCommand(options: { name?: string; all?: boolean }): void {
  const status = readProcessStatus();
  const processes = Object.entries(status);

  if (processes.length === 0) {
    log.warn(`${APP_CONSTANTS.LOG_PREFIX} No processes found.`);
    return;
  }

  if (options.all) {
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Resetting metrics for all processes...`);
    
    let resetCount = 0;
    for (const [name, data] of processes) {
      status[name] = {
        ...data,
        restarts: 0,
      };
      resetCount++;
      log.success(`${APP_CONSTANTS.LOG_PREFIX} ✓ Reset: ${name}`);
    }
    
    writeProcessStatus(status);
    log.success(`${APP_CONSTANTS.LOG_PREFIX} Reset metrics for ${resetCount} process(es)`);
  } else if (options.name) {
    const processData = status[options.name];
    
    if (!processData) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Process not found: ${options.name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
    
    status[options.name] = {
      ...processData,
      restarts: 0,
    };
    
    writeProcessStatus(status);
    log.success(`${APP_CONSTANTS.LOG_PREFIX} ✓ Reset metrics for: ${options.name}`);
  } else {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Please specify a process name with --name or use --all`);
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }
}
