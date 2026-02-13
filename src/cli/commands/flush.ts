import { readdirSync, unlinkSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_PROCESS_CONFIG } from '../../utils/config/constants';

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
  const logDir = DEFAULT_PROCESS_CONFIG.logDir;
  const log = console;
  
  if (!existsSync(logDir)) {
    log.log('[TSPM] No log directory found');
    return;
  }
  
  // Read status file directly to get process names
  let processNames: string[] = [];
  const { STATUS_FILE } = require('../state/constants');
  try {
    const statusFile = require('fs').readFileSync(STATUS_FILE, 'utf-8');
    const status = JSON.parse(statusFile);
    processNames = Object.keys(status);
  } catch (e) {
    // If no status file, list directories in log folder
    try {
      const files = readdirSync(logDir);
      processNames = [...new Set(files.map(f => f.replace(/\.log.*$/, '').replace(/-out$/, '').replace(/-err$/, '')))];
    } catch (err) {
      processNames = [];
    }
  }
  
  if (options.name) {
    processNames = [options.name];
  }
  
  let totalFilesCleared = 0;
  
  for (const name of processNames) {
    const logPaths = getLogPaths(name, logDir);
    
    // Filter based on options
    const filteredPaths = logPaths.filter(path => {
      if (options.err && !path.includes('-err') && !path.endsWith('.log')) return false;
      if (options.out && !path.includes('-out') && !path.match(/[^-]out\.log$/)) return false;
      return true;
    });
    
    for (const path of filteredPaths) {
      try {
        // Clear file content by writing empty string
        writeFileSync(path, '');
        totalFilesCleared++;
      } catch (writeError) {
        log.error(`[TSPM] Failed to clear log: ${path} - ${writeError}`);
      }
    }
    
    if (filteredPaths.length > 0) {
      log.log(`[TSPM] ✓ Flushed ${filteredPaths.length} log file(s) for: ${name}`);
    }
  }
  
  if (totalFilesCleared === 0) {
    log.log('[TSPM] No log files to flush');
  } else {
    log.log(`[TSPM] ✓ Total: ${totalFilesCleared} log file(s) flushed`);
  }
}
