import { EXIT_CODES, APP_CONSTANTS, SIGNALS } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus, removeProcessStatus } from '../state/status';

export function stopCommand(options: { all?: boolean; name?: string }): void {
  const status = readProcessStatus();

  if (Object.keys(status).length === 0) {
    log.info(`${APP_CONSTANTS.LOG_PREFIX} No processes to stop`);
    return;
  }

  if (options.all || (!options.name && Object.keys(status).length > 0)) {
    // Stop all processes
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Stopping all processes...`);
    for (const [name, data] of Object.entries(status)) {
      try {
        if (data.pid) {
          process.kill(data.pid, SIGNALS.GRACEFUL_SHUTDOWN);
        }
        removeProcessStatus(name);
        log.success(`${APP_CONSTANTS.LOG_PREFIX} ✓ Stopped: ${name}`);
      } catch (e) {
        log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to stop ${name}: ${e}`);
      }
    }
    log.info(`${APP_CONSTANTS.LOG_PREFIX} All processes stopped`);
  } else if (options.name) {
    // Stop specific process
    const data = status[options.name];
    if (data) {
      try {
        if (data.pid) {
          process.kill(data.pid, SIGNALS.GRACEFUL_SHUTDOWN);
        }
        removeProcessStatus(options.name);
        log.success(`${APP_CONSTANTS.LOG_PREFIX} ✓ Stopped: ${options.name}`);
      } catch (e) {
        log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to stop ${options.name}: ${e}`);
        process.exit(EXIT_CODES.ERROR);
      }
    } else {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Process not found: ${options.name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
  }
}
