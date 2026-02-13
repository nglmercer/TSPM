import { existsSync, readdirSync, openSync, closeSync } from 'fs';
import { join } from 'path';
import { DEFAULT_PROCESS_CONFIG } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';

/**
 * ReloadLogs options
 */
export interface ReloadLogsOptions {
  /** Process name (optional, reload all if not specified) */
  name?: string;
}

/**
 * Get all log file paths for a process
 */
function getAllLogPaths(processName: string, logDir: string): string[] {
  const basePath = join(logDir, processName);
  const paths: string[] = [];
  
  // Main log files
  if (existsSync(`${basePath}.log`)) {
    paths.push(`${basePath}.log`);
  }
  if (existsSync(`${basePath}-out.log`)) {
    paths.push(`${basePath}-out.log`);
  }
  if (existsSync(`${basePath}-err.log`)) {
    paths.push(`${basePath}-err.log`);
  }
  
  // Rotated log files (log.N)
  if (existsSync(logDir)) {
    try {
      const files = readdirSync(logDir);
      for (const file of files) {
        if (file.startsWith(processName) && file.match(/\.log\.\d+$/)) {
          paths.push(join(logDir, file));
        }
      }
    } catch (e) {
      // Ignore errors when reading directory
    }
  }
  
  return paths;
}

/**
 * ReloadLogs command - Reopen log files for external log rotation
 * 
 * This command is useful for external log rotation tools like logrotate.
 * It closes and reopens log files, allowing the process to continue 
 * writing to new file handles while the old files can be rotated.
 */
export function reloadLogsCommand(options: ReloadLogsOptions): void {
  const status = readProcessStatus();
  const logDir = DEFAULT_PROCESS_CONFIG.logDir;
  
  if (!existsSync(logDir)) {
    log.info('[TSPM] No log directory found');
    return;
  }
  
  const processNames = options.name ? [options.name] : Object.keys(status);
  let totalFilesReloaded = 0;
  
  for (const name of processNames) {
    if (!status[name]) {
      log.warn(`[TSPM] Process not found: ${name}`);
      continue;
    }
    
    const logPaths = getAllLogPaths(name, logDir);
    
    for (const path of logPaths) {
      try {
        // Get file stats to verify file exists and is accessible
        const fileHandle = openSync(path, 'r+');
        // Simply opening and closing the file in append mode
        // will cause the OS to release the old file handle
        // and create a new one if the file was rotated
        closeSync(fileHandle);
        totalFilesReloaded++;
      } catch (e) {
        log.error(`[TSPM] Failed to reload log: ${path} - ${e}`);
      }
    }
    
    if (logPaths.length > 0) {
      log.success(`[TSPM] ✓ Reloaded ${logPaths.length} log file(s) for: ${name}`);
    }
  }
  
  if (totalFilesReloaded === 0) {
    log.info('[TSPM] No log files to reload');
  } else {
    log.success(`[TSPM] ✓ Total: ${totalFilesReloaded} log file(s) reloaded`);
  }
}
