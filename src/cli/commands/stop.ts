import { EXIT_CODES } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus, removeProcessStatus } from '../state/status';

export function stopCommand(options: { all?: boolean; name?: string }): void {
  const status = readProcessStatus();

  if (Object.keys(status).length === 0) {
    log.info('[TSPM] No processes to stop');
    return;
  }

  if (options.all || (!options.name && Object.keys(status).length > 0)) {
    // Stop all processes
    log.info('[TSPM] Stopping all processes...');
    for (const [name, data] of Object.entries(status)) {
      try {
        if (data.pid) {
          process.kill(data.pid, 'SIGTERM');
        }
        removeProcessStatus(name);
        log.success(`[TSPM] ✓ Stopped: ${name}`);
      } catch (e) {
        log.error(`[TSPM] Failed to stop ${name}: ${e}`);
      }
    }
    log.info('[TSPM] All processes stopped');
  } else if (options.name) {
    // Stop specific process
    const data = status[options.name];
    if (data) {
      try {
        if (data.pid) {
          process.kill(data.pid, 'SIGTERM');
        }
        removeProcessStatus(options.name);
        log.success(`[TSPM] ✓ Stopped: ${options.name}`);
      } catch (e) {
        log.error(`[TSPM] Failed to stop ${options.name}: ${e}`);
        process.exit(EXIT_CODES.ERROR);
      }
    } else {
      log.error(`[TSPM] Process not found: ${options.name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
  }
}
