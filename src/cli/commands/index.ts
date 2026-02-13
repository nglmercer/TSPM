export * from './start';
export * from './stop';
export * from './list';
export * from './logs';
export * from './describe';
export * from './monit';
export * from './cluster';
export * from './scale';
export * from './groups';

import { startCommand } from './start';
import { stopCommand } from './stop';
import { readProcessStatus, removeProcessStatus } from '../state/status';
import { EXIT_CODES } from '../../utils/config/constants';
import { log } from '../../utils/logger';

/**
 * Restart command - Restart one or all processes
 */
export async function restartCommand(
  configFile: string,
  options: { all?: boolean; name?: string }
): Promise<void> {
  // First stop
  stopCommand(options);

  // Then start
  await startCommand(configFile, { name: options.name });
}

/**
 * Reload command - Reload process(es) without downtime (alias for restart)
 */
export async function reloadCommand(
  configFile: string,
  options: { all?: boolean; name?: string }
): Promise<void> {
  await restartCommand(configFile, options);
}

/**
 * Delete command - Delete a process from the list (stops it first if running)
 */
export function deleteCommand(options: { all?: boolean; name?: string }): void {
  const status = readProcessStatus();

  if (options.all) {
    log.info('[TSPM] Deleting all processes...');
    for (const name of Object.keys(status)) {
      // First stop if running
      const data = status[name];
      if (data && data.pid) {
        try { process.kill(data.pid, 'SIGKILL'); } catch {}
      }
      removeProcessStatus(name);
      log.success(`[TSPM] ✓ Deleted: ${name}`);
    }
  } else if (options.name) {
    const data = status[options.name];
    if (data) {
      if (data.pid) {
        try { process.kill(data.pid, 'SIGKILL'); } catch {}
      }
      removeProcessStatus(options.name);
      log.success(`[TSPM] ✓ Deleted: ${options.name}`);
    } else {
      log.error(`[TSPM] Process not found: ${options.name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
  } else {
    log.error('[TSPM] Please specify a process name or use --all');
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }
}
