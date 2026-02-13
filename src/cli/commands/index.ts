export * from './start';
export * from './stop';
export * from './list';
export * from './logs';
export * from './describe';
export * from './monit';

import { startCommand } from './start';
import { stopCommand } from './stop';

export async function restartCommand(
  configFile: string,
  options: { all?: boolean; name?: string }
): Promise<void> {
  stopCommand({ all: true });
  await startCommand(configFile, { name: options.name });
}

export async function reloadCommand(
  configFile: string,
  options: { all?: boolean; name?: string }
): Promise<void> {
  await restartCommand(configFile, options);
}

import { readProcessStatus, removeProcessStatus } from '../state/status';
import { EXIT_CODES } from '../../utils/config/constants';
import { log } from '../../utils/logger';

export function deleteCommand(options: { all?: boolean; name?: string }): void {
  const status = readProcessStatus();

  if (options.all) {
    log.info('[TSPM] Deleting all processes...');
    for (const name of Object.keys(status)) {
      removeProcessStatus(name);
      log.success(`[TSPM] ✓ Deleted: ${name}`);
    }
  } else if (options.name) {
    if (status[options.name]) {
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
