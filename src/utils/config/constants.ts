/**
 * Configuration Constants and Defaults
 * Central place for all configuration-related constants
 * @module utils/config/constants
 */

/**
 * Process state enum values
 */
export const ProcessStateValues = {
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERRORED: 'errored',
  RESTARTING: 'restarting',
} as const;

/**
 * Process state type
 */
export type ProcessState = typeof ProcessStateValues[keyof typeof ProcessStateValues];

/**
 * Config format enum values
 */
export const ConfigFormatValues = {
  YAML: 'yaml',
  YML: 'yml',
  JSON: 'json',
  JSONC: 'jsonc',
} as const;

/**
 * Config format type
 */
export type ConfigFormat = typeof ConfigFormatValues[keyof typeof ConfigFormatValues];

/**
 * Error severity enum values
 */
export const ErrorSeverityValues = {
  ERROR: 'error',
  WARNING: 'warning',
} as const;

/**
 * Error severity type
 */
export type ErrorSeverity = typeof ErrorSeverityValues[keyof typeof ErrorSeverityValues];

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
  /** Minimum delay between restarts in ms */
  minRestartDelay: 100,
  /** Maximum delay between restarts in ms */
  maxRestartDelay: 30000,
  /** Restart backoff multiplier */
  restartBackoff: 2,
  /** Kill timeout in milliseconds */
  killTimeout: 5000,
  /** Default log directory */
  logDir: 'logs',
  /** PID file directory */
  pidDir: '.pids',
  /** Max memory in bytes (0 = disabled) */
  maxMemory: 0,
  /** Minimum uptime in ms before considering restart successful */
  minUptime: 0,
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
 * Process state constants (deprecated - use ProcessStateValues)
 * @deprecated Use ProcessStateValues instead
 */
export const PROCESS_STATE = ProcessStateValues;

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
 * Exit code type
 */
export type ExitCode = typeof EXIT_CODES[keyof typeof EXIT_CODES];

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
 * Signal type
 */
export type Signal = typeof SIGNALS[keyof typeof SIGNALS];

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
 * Environment variable name type
 */
export type EnvVar = typeof ENV_VARS[keyof typeof ENV_VARS];

/**
 * File extensions for configuration files
 */
export const CONFIG_FILE_EXTENSIONS: Record<ConfigFormat, readonly string[]> = {
  yaml: ['.yaml'],
  yml: ['.yml'],
  json: ['.json'],
  jsonc: ['.jsonc'],
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
 * @param logDir - Log directory (defaults to DEFAULT_PROCESS_CONFIG.logDir)
 * @returns Log file path
 */
export function getDefaultLogPath(
  processName: string, 
  logDir: string = DEFAULT_PROCESS_CONFIG.logDir
): string {
  return `${logDir}/${processName}.log`;
}

/**
 * Get the default PID file path for a process
 * 
 * @param processName - Name of the process
 * @param pidDir - PID directory (defaults to DEFAULT_PROCESS_CONFIG.pidDir)
 * @returns PID file path
 */
export function getDefaultPidPath(
  processName: string, 
  pidDir: string = DEFAULT_PROCESS_CONFIG.pidDir
): string {
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

// ============================================================================
// Phase 2: Process Management Enhancements - Constants
// ============================================================================

/**
 * Load balancing strategy values
 */
export const LOAD_BALANCE_STRATEGY = {
  ROUND_ROBIN: 'round-robin',
  RANDOM: 'random',
  LEAST_CONNECTIONS: 'least-connections',
  LEAST_CPU: 'least-cpu',
  LEAST_MEMORY: 'least-memory',
  IP_HASH: 'ip-hash',
  WEIGHTED: 'weighted',
} as const;

/**
 * Load balancing strategy type
 */
export type LoadBalanceStrategy = typeof LOAD_BALANCE_STRATEGY[keyof typeof LOAD_BALANCE_STRATEGY];

/**
 * Health check protocol values
 */
export const HEALTH_CHECK_PROTOCOL = {
  HTTP: 'http',
  HTTPS: 'https',
  TCP: 'tcp',
  COMMAND: 'command',
  NONE: 'none',
} as const;

/**
 * Health check protocol type
 */
export type HealthCheckProtocol = typeof HEALTH_CHECK_PROTOCOL[keyof typeof HEALTH_CHECK_PROTOCOL];

/**
 * Health check status values
 */
export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  STARTING: 'starting',
  STOPPING: 'stopping',
  UNKNOWN: 'unknown',
} as const;

/**
 * Health check status type
 */
export type HealthStatus = typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS];

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CHECK = {
  enabled: false,
  protocol: HEALTH_CHECK_PROTOCOL.NONE,
  timeout: 5000,
  interval: 30000,
  retries: 3,
  initialDelay: 5000,
} as const;

/**
 * Cluster configuration defaults
 */
export const CLUSTER_CONFIG = {
  /** Default instance count */
  defaultInstances: 1,
  /** Maximum instances per process */
  maxInstances: 32,
  /** Default load balancing strategy */
  defaultStrategy: LOAD_BALANCE_STRATEGY.ROUND_ROBIN,
} as const;

/**
 * Instance status values
 */
export const INSTANCE_STATE = {
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERRORED: 'errored',
  UNHEALTHY: 'unhealthy',
} as const;

/**
 * Instance state type
 */
export type InstanceState = typeof INSTANCE_STATE[keyof typeof INSTANCE_STATE];
