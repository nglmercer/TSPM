import { readdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { DEFAULT_PROCESS_CONFIG } from '../../utils/config/constants';
import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';

/**
 * Flush command options
 */
export interface FlushOptions {
  /** Process name (optional, flush all if not specified) */
  name?: string;
  /** Flush error logs only */
  err?: boolean;
  /** Flush out logs only */
  out?: boolean;
  /** Flush all logs (default) */
  all?: boolean;
}

/**
 * Get log file paths for a process
 */
function getLogPaths(processName: string, logDir: string): string[] {
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
 * Flush command - Clear all log files for processes
 * 
 * This command clears the log files for managed processes.
 * It can flush all logs, or specific types (out/err).
 */
export function flushCommand(options: FlushOptions): void {
  const status = readProcessStatus();
  const logDir = DEFAULT_PROCESS_CONFIG.logDir;
  
  if (!existsSync(logDir)) {
    log.info('[TSPM] No log directory found');
    return;
  }
  
  const processNames = options.name ? [options.name] : Object.keys(status);
  let totalFilesCleared = 0;
  
  for (const name of processNames) {
    if (!status[name]) {
      log.warn(`[TSPM] Process not found: ${name}`);
      continue;
    }
    
    const logPaths = getLogPaths(name, logDir);
    
    // Filter based on options
    const filteredPaths = logPaths.filter(path => {
      if (options.err && !path.includes('-err') && !path.endsWith('.log')) return false;
      if (options.out && !path.includes('-out') && !path.match(/[^-]out\.log$/)) return false;
      return true;
    });
    
    for (const path of filteredPaths) {
      try {
        // Clear file content instead of deleting (preserves file permissions)
        const Bun = require('bun');
        Bun.write(path, '');
        totalFilesCleared++;
      } catch (e) {
        // Fallback: try to unlink and recreate
        try {
          unlinkSync(path);
          const Bun = require('bun');
          Bun.write(path, '');
          totalFilesCleared++;
        } catch (writeError) {
          log.error(`[TSPM] Failed to clear log: ${path} - ${writeError}`);
        }
      }
    }
    
    if (filteredPaths.length > 0) {
      log.success(`[TSPM] ✓ Flushed ${filteredPaths.length} log file(s) for: ${name}`);
    }
  }
  
  if (totalFilesCleared === 0) {
    log.info('[TSPM] No log files to flush');
  } else {
    log.success(`[TSPM] ✓ Total: ${totalFilesCleared} log file(s) flushed`);
  }
}
