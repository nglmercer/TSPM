import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DEFAULT_PROCESS_CONFIG } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';

export function logsCommand(options: { name?: string; lines?: number; raw?: boolean }): void {
  const status = readProcessStatus();
  const logDir = DEFAULT_PROCESS_CONFIG.logDir;
  const numLines = options.lines || 50;

  const processNames = options.name ? [options.name] : Object.keys(status);

  for (const name of processNames) {
    const logPath = join(logDir, `${name}.log`);
    if (existsSync(logPath)) {
      if (!options.raw) {
        log.raw(`\n=== ${name} (last ${numLines} lines) ===`);
      }
      try {
        const content = readFileSync(logPath, 'utf-8');
        const lines = content.split('\n');
        const showLines = lines.slice(-numLines);
        log.raw(showLines.join('\n'));
      } catch (e) {
        log.error(`[TSPM] Failed to read logs for ${name}: ${e}`);
      }
    } else {
      log.info(`[TSPM] No log file found for: ${name}`);
    }
  }
}
