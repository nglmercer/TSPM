/**
 * Configuration Constants and Defaults
 * Central place for all configuration-related constants
 * @module utils/config/constants
 */

/**
 * Default configuration file names to search for
 */
export const DEFAULT_CONFIG_FILES = [
  'tspm.yaml',
  'tspm.yml',
  'tspm.json',
  'tspm.jsonc',
  'ecosystem.config.yaml',
  'ecosystem.config.yml',
  'ecosystem.config.json',
  'ecosystem.config.jsonc',
] as const;

/**
 * Default process configuration values
 */
export const DEFAULT_PROCESS_CONFIG = {
  /** Auto-restart on exit */
  autorestart: true,
  /** Maximum restart attempts before giving up */
  maxRestarts: 10,
  /** Kill timeout in milliseconds */
  killTimeout: 5000,
  /** Default log directory */
  logDir: 'logs',
  /** PID file directory */
  pidDir: '.pids',
} as const;

/**
 * Restart policy configuration
 */
export const RESTART_CONFIG = {
  /** Minimum delay between restarts (ms) */
  minDelay: 100,
  /** Maximum delay between restarts (ms) */
  maxDelay: 30000,
  /** Base delay for exponential backoff (ms) */
  baseDelay: 1000,
  /** Backoff multiplier */
  backoffMultiplier: 2,
} as const;

/**
 * File watching configuration
 */
export const WATCH_CONFIG = {
  /** Default debounce time for file changes (ms) */
  debounceMs: 100,
  /** Default ignored patterns */
  defaultIgnore: [
    'node_modules/**',
    '.git/**',
    'logs/**',
    '*.log',
    '.pids/**',
  ],
} as const;

/**
 * Log configuration
 */
export const LOG_CONFIG = {
  /** Default date format for log timestamps */
  dateFormat: 'YYYY-MM-DD HH:mm:ss',
  /** Maximum log file size before rotation (bytes) */
  maxFileSize: 10 * 1024 * 1024, // 10MB
  /** Number of rotated log files to keep */
  maxFiles: 5,
} as const;

/**
 * Process state constants
 */
export const PROCESS_STATE = {
  /** Process is starting */
  STARTING: 'starting',
  /** Process is running */
  RUNNING: 'running',
  /** Process is stopping */
  STOPPING: 'stopping',
  /** Process has stopped */
  STOPPED: 'stopped',
  /** Process exited with error */
  ERRORED: 'errored',
  /** Process is restarting */
  RESTARTING: 'restarting',
} as const;

/**
 * Exit codes for TSPM CLI
 */
export const EXIT_CODES = {
  /** Success */
  SUCCESS: 0,
  /** General error */
  ERROR: 1,
  /** Config file not found */
  CONFIG_NOT_FOUND: 2,
  /** Config validation failed */
  CONFIG_INVALID: 3,
  /** Process not found */
  PROCESS_NOT_FOUND: 4,
  /** Process failed to start */
  PROCESS_START_FAILED: 5,
  /** Permission denied */
  PERMISSION_DENIED: 6,
} as const;

/**
 * Signal constants for process management
 */
export const SIGNALS = {
  /** Graceful shutdown signal */
  GRACEFUL_SHUTDOWN: 'SIGTERM',
  /** Forceful shutdown signal */
  FORCEFUL_SHUTDOWN: 'SIGKILL',
  /** Reload signal */
  RELOAD: 'SIGHUP',
  /** Interrupt signal */
  INTERRUPT: 'SIGINT',
} as const;

/**
 * Environment variable names used by TSPM
 */
export const ENV_VARS = {
  /** TSPM config file path */
  CONFIG_PATH: 'TSPM_CONFIG_PATH',
  /** TSPM log level */
  LOG_LEVEL: 'TSPM_LOG_LEVEL',
  /** TSPM home directory */
  HOME: 'TSPM_HOME',
  /** Process name environment variable */
  PROCESS_NAME: 'TSPM_PROCESS_NAME',
  /** Instance ID for clustering */
  INSTANCE_ID: 'TSPM_INSTANCE_ID',
} as const;

/**
 * File extensions for configuration files
 */
export const CONFIG_FILE_EXTENSIONS = {
  YAML: ['.yaml', '.yml'],
  JSON: ['.json'],
  JSONC: ['.jsonc'],
} as const;

/**
 * MIME types for configuration files
 */
export const CONFIG_MIME_TYPES = {
  YAML: 'text/yaml',
  JSON: 'application/json',
  JSONC: 'application/jsonc',
} as const;

/**
 * Get the default log file path for a process
 * 
 * @param processName - Name of the process
 * @param logDir - Log directory (defaults to 'logs')
 * @returns Log file path
 */
export function getDefaultLogPath(processName: string, logDir: string = 'logs'): string {
  return `${logDir}/${processName}.log`;
}

/**
 * Get the default PID file path for a process
 * 
 * @param processName - Name of the process
 * @param pidDir - PID directory (defaults to '.pids')
 * @returns PID file path
 */
export function getDefaultPidPath(processName: string, pidDir: string = '.pids'): string {
  return `${pidDir}/${processName}.pid`;
}

/**
 * Calculate restart delay with exponential backoff
 * 
 * @param restartCount - Number of restarts attempted
 * @returns Delay in milliseconds
 */
export function calculateRestartDelay(restartCount: number): number {
  const { baseDelay, maxDelay, backoffMultiplier } = RESTART_CONFIG;
  const delay = baseDelay * Math.pow(backoffMultiplier, restartCount);
  return Math.min(delay, maxDelay);
}
