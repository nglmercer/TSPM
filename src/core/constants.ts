/**
 * Core Constants for TSPM
 * Central place for all core process management constants
 * @module core/constants
 */

// Re-export all constants from config/constants for convenience
export * from '../utils/config/constants';

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

export type ProcessState = typeof ProcessStateValues[keyof typeof ProcessStateValues];

/**
 * Process state transition map
 * Defines valid state transitions
 */
export const VALID_STATE_TRANSITIONS: Record<ProcessState, ProcessState[]> = {
  starting: ['running', 'errored', 'stopped'],
  running: ['stopping', 'errored', 'restarting'],
  stopping: ['stopped', 'errored'],
  stopped: ['starting'],
  errored: ['starting', 'stopped', 'restarting'],
  restarting: ['starting', 'stopped', 'errored'],
} as const;

/**
 * Process lifecycle hooks
 */
export const PROCESS_HOOKS = {
  PRE_START: 'preStart',
  POST_START: 'postStart',
  PRE_STOP: 'preStop',
  POST_STOP: 'postStop',
} as const;

export type ProcessHook = typeof PROCESS_HOOKS[keyof typeof PROCESS_HOOKS];

/**
 * Process configuration keys
 */
export const PROCESS_CONFIG_KEYS = {
  NAME: 'name',
  SCRIPT: 'script',
  ARGS: 'args',
  CWD: 'cwd',
  ENV: 'env',
  INSTANCES: 'instances',
  AUTORESTART: 'autorestart',
  WATCH: 'watch',
  MAX_MEMORY: 'maxMemory',
  NAMESPACE: 'namespace',
  CLUSTER_GROUP: 'clusterGroup',
  LB_STRATEGY: 'lbStrategy',
  INSTANCE_WEIGHT: 'instanceWeight',
  DOT_ENV: 'dotEnv',
  STDOUT: 'stdout',
  STDERR: 'stderr',
  PRE_START: 'preStart',
  POST_START: 'postStart',
  HEALTH_CHECK: 'healthCheck',
} as const;

/**
 * Default timeout values in milliseconds
 */
export const TIMEOUTS = {
  /** Default wait time for process to stop gracefully */
  GRACEFUL_STOP: 500,
  /** Default process startup wait time */
  STARTUP_WAIT: 1000,
  /** Default restart delay maximum */
  MAX_RESTART_DELAY: 30000,
  /** Base restart delay */
  BASE_RESTART_DELAY: 1000,
} as const;

/**
 * Bun-specific environment variables
 */
export const BUN_ENV_VARS = {
  /** Enable source maps in Bun */
  VERBOSE_SOURCE_MAPS: 'BUN_CONFIG_VERBOSE_SOURCE_MAPS',
} as const;

/**
 * Node-specific environment variables
 */
export const NODE_ENV_VARS = {
  /** Node.js options */
  NODE_OPTIONS: 'NODE_OPTIONS',
} as const;
