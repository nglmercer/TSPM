/**
 * Central Constants for TSPM
 * Contains all magic strings and enums centralized for better maintainability
 * @module utils/constants
 */

// ============================================================================
// Application Constants
// ============================================================================

/**
 * Application name and version
 */
export const APP = {
  NAME: 'TSPM',
  VERSION: '1.0.0',
  DESCRIPTION: 'TypeScript Process Manager',
} as const;

/**
 * Default host addresses
 */
export const DEFAULT_HOST = {
  LOCAL: 'localhost',
  ALL: '0.0.0.0',
} as const;

/**
 * Default port numbers
 */
export const DEFAULT_PORT = {
  API: 3000,
  HTTP: 80,
  HTTPS: 443,
} as const;

// ============================================================================
// API Constants
// ============================================================================

/**
 * API-related constants
 */
export const API = {
  VERSION: 'v1',
  DEFAULT_PORT: 3000,
  DEFAULT_HOST: '0.0.0.0',
  TIMEOUT: 30000,
} as const;

/**
 * API response messages
 */
export const API_MESSAGES = {
  PROCESS_NAME_REQUIRED: 'Process name required',
  INVALID_ACTION: 'Invalid action',
  NOT_FOUND: 'Not Found',
  SUCCESS: 'Success',
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  ROOT: '/',
  STATUS: '/status',
  PROCESS: '/process',
} as const;

// ============================================================================
// HTTP Constants
// ============================================================================

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * HTTP content types
 */
export const HTTP_CONTENT_TYPE = {
  JSON: 'application/json',
  TEXT: 'text/plain',
  HTML: 'text/html',
} as const;

/**
 * Default HTTP headers
 */
export const HTTP_HEADERS = {
  USER_AGENT: 'TSPM-Webhook/1.0',
  CONTENT_TYPE: 'application/json',
} as const;

// ============================================================================
// Process State Constants
// ============================================================================

/**
 * Process state values
 */
export const PROCESS_STATE = {
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERRORED: 'errored',
  RESTARTING: 'restarting',
} as const;

export type ProcessState = typeof PROCESS_STATE[keyof typeof PROCESS_STATE];

// ============================================================================
// Log/Console Constants
// ============================================================================

/**
 * Console prefix
 */
export const CONSOLE_PREFIX = {
  TSPM: '[TSPM]',
  API: '[TSPM API]',
  WEBHOOK: '[TSPM Webhook]',
  MONITORING: '[TSPM Monitoring]',
  EVENT: '[TSPM Event]',
} as const;

/**
 * Log messages
 */
export const LOG_MESSAGES = {
  // Process lifecycle
  STARTING_PROCESS: (name: string, instance: number) => `Starting process: ${name} (instance: ${instance})`,
  STOPPED_PROCESS: (name: string) => `Stopped process: ${name}`,
  RESTARTING_PROCESS: (name: string, reason: string) => `Restarting process: ${name} (reason: ${reason})`,
  PROCESS_EXITED: (name: string, code: number | null) => `Process ${name} exited with code ${code}`,
  PROCESS_ERROR: (name: string, error: string) => `Process ${name} error: ${error}`,
  
  // Watcher
  WATCHER_SETUP: (name: string, path: string) => `Setup watcher for ${name} on ${path}`,
  WATCHER_FILE_CHANGED: (filename: string) => `Watcher: File changed: ${filename}`,
  
  // Scripts
  RUNNING_PRESTART: (name: string, script: string) => `Running preStart script for ${name}: ${script}`,
  PRESTART_FAILED: (name: string, code: number) => `preStart script for ${name} failed with code ${code}`,
  RUNNING_POSTSTART: (name: string, script: string) => `Running postStart script for ${name}: ${script}`,
  POSTSTART_FAILED: (name: string, code: number) => `postStart script for ${name} failed with code ${code}`,
  
  // Memory monitoring
  MEMORY_EXCEEDED: (name: string, memory: number, limit: number) => 
    `Process ${name} exceeded memory limit: ${memory} bytes > ${limit} bytes`,
  
  // Configuration
  DOTENV_NOT_FOUND: (path: string) => `dotEnv file not found: ${path}`,
  DOTENV_ERROR: (name: string, error: string) => `Error loading dotEnv for ${name}: ${error}`,
  
  // Watcher errors
  WATCHER_SETUP_FAILED: (error: string) => `Failed to setup watcher: ${error}`,
  
  // Restart
  RESTART_DELAY: (name: string, delay: number) => `Restarting ${name} in ${delay}ms...`,
  
  // Generic errors
  ERROR_RUNNING: (operation: string, error: string) => `Error running ${operation}: ${error}`,
  ERROR_WRITING: (path: string, error: string) => `Error writing to ${path}: ${error}`,
  
  // API
  API_REQUEST: (method: string, path: string) => `${method} ${path}`,
  API_STARTED: (host: string, port: number) => `API Server started on http://${host}:${port}`,
  API_FAILED: (error: string) => `Failed to start API Server: ${error}`,
  
  // Webhook
  WEBHOOK_FAILED: (url: string, status: number, text: string) => 
    `Failed to send to ${url}: ${status} ${text}`,
  WEBHOOK_ERROR: (url: string, error: string) => `Error sending to ${url}: ${error}`,
  
  // Monitoring
  MONITORING_STARTED: 'Monitoring service started',
  MONITORING_STOPPED: 'Monitoring service stopped',
  MONITORING_ALREADY_RUNNING: 'Monitoring service is already running',
  
  // Log rotation
  LOG_ROTATION_ERROR: (path: string, error: string) => `Log rotation error for ${path}: ${error}`,
  LOG_CLEANUP_ERROR: (error: string) => `Log cleanup error: ${error}`,
  LOG_WRITE_FAILED: (error: string) => `Failed to write to log file: ${error}`,
  
  // Event emitter
  EVENT_LISTENER_EXCEEDED: (max: number, type: string) => 
    `Warning: Event listener limit (${max}) exceeded for "${type}"`,
  LISTENER_ADDED: (type: string, priority: string, once: boolean) => 
    `Listener added for "${type}" (priority: ${priority}, once: ${once})`,
  LISTENER_REMOVED: (type: string) => `Listener removed for "${type}"`,
  ALL_LISTENERS_REMOVED: (type: string) => `All listeners removed for "${type}"`,
  ALL_LISTENERS_CLEARED: 'All listeners removed',
  EVENT_EMITTED: (type: string) => `Event emitted: ${type}`,
  
  // CLI messages
  CLI_PROCESS_NAME_REQUIRED: 'Please specify a process name with --name or use --all',
  CLI_NOT_IMPLEMENTED: (feature: string) => `${feature} not yet implemented`,
} as const;

// ============================================================================
// Event Constants (re-exported and extended from events.ts)
// ============================================================================

/**
 * Event type values (centralized from events.ts)
 */
export const EVENT_TYPES = {
  // Process lifecycle events
  PROCESS_START: 'process:start',
  PROCESS_STOP: 'process:stop',
  PROCESS_RESTART: 'process:restart',
  PROCESS_EXIT: 'process:exit',
  PROCESS_ERROR: 'process:error',
  PROCESS_STATE_CHANGE: 'process:state-change',
  PROCESS_LOG: 'process:log',
  PROCESS_OOM: 'process:oom',
  
  // Cluster events
  INSTANCE_ADD: 'instance:add',
  INSTANCE_REMOVE: 'instance:remove',
  INSTANCE_HEALTH_CHANGE: 'instance:health-change',
  
  // System events
  SYSTEM_START: 'system:start',
  SYSTEM_STOP: 'system:stop',
  SYSTEM_ERROR: 'system:error',
  
  // Monitoring events
  METRICS_UPDATE: 'metrics:update',
  CPU_HIGH: 'metrics:cpu-high',
  MEMORY_HIGH: 'metrics:memory-high',
  
  // Config events
  CONFIG_RELOAD: 'config:reload',
  CONFIG_CHANGE: 'config:change',
} as const;

// ============================================================================
// Restart Reason Constants
// ============================================================================

/**
 * Restart reason values
 */
export const RESTART_REASON = {
  MANUAL: 'manual',
  WATCH: 'watch',
  AUTO: 'auto',
  ERROR: 'error',
  SIGNAL: 'signal',
  UNKNOWN: 'unknown',
} as const;

/**
 * Stop reason values
 */
export const STOP_REASON = {
  MANUAL: 'manual',
  ERROR: 'error',
  SIGNAL: 'signal',
  UNKNOWN: 'unknown',
} as const;

// ============================================================================
// Monitoring Constants
// ============================================================================

/**
 * Monitoring intervals in milliseconds
 */
export const MONITORING_INTERVAL = {
  MEMORY_CHECK: 5000,
  STATS_UPDATE: 1000,
  HEALTH_CHECK: 30000,
} as const;

/**
 * Default thresholds
 */
export const THRESHOLDS = {
  DEFAULT_MEMORY: 0,
  DEFAULT_CPU: 80,
  DEFAULT_RETRIES: 3,
} as const;

// ============================================================================
// File Path Constants
// ============================================================================

/**
 * Default file paths
 */
export const DEFAULT_PATHS = {
  LOG_DIR: 'logs',
  PID_DIR: '.pids',
  KEEP_FILE: '.keep',
} as const;

/**
 * File extensions
 */
export const FILE_EXTENSIONS = {
  LOG: '.log',
  PID: '.pid',
  YAML: '.yaml',
  YML: '.yml',
  JSON: '.json',
  JSONC: '.jsonc',
  TS: '.ts',
  JS: '.js',
} as const;

// ============================================================================
// Interpolation Helper
// ============================================================================

/**
 * Create a interpolator function for consistent message formatting
 */
export function createMessageFormatter(template: string): (args: Record<string, string | number>) => string {
  return (args: Record<string, string | number>): string => {
    let result = template;
    for (const [key, value] of Object.entries(args)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return result;
  };
}
