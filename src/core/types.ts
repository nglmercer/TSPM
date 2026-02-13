/**
 * Core type definitions for TSPM (TypeScript Process Manager)
 * Re-exports from the config schema module for consistency
 */

// Re-export types from schema module
export type {
  ProcessConfig,
  TSPMConfig,
  ValidationResult,
  ValidationError,
} from '../utils/config/schema';

// Re-export constants
export {
  DEFAULT_PROCESS_CONFIG,
  DEFAULT_CONFIG_FILES,
  PROCESS_STATE,
  ProcessStateValues,
  EXIT_CODES,
  SIGNALS,
  ENV_VARS,
  RESTART_CONFIG,
  WATCH_CONFIG,
  LOG_CONFIG,
} from '../utils/config/constants';

import { type ProcessState } from '../utils/config/constants';
export { type ProcessState } from '../utils/config/constants';

// Re-export config utilities
export {
  ConfigManager,
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  getConfigManager,
  loadConfig,
} from '../utils/config/manager';

export {
  validateConfig,
  validateProcessConfig,
  normalizeConfig,
  applyDefaults,
} from '../utils/config/schema';

/**
 * Process status information
 */
export interface ProcessStatus {
  /** Process name */
  name: string;
  /** Process ID */
  pid?: number;
  /** Whether process has been killed */
  killed?: boolean;
  /** Exit code if process has exited */
  exitCode?: number;
  /** Current state of the process */
  state?: ProcessState;
  /** Number of restart attempts */
  restartCount?: number;
  /** Process uptime in milliseconds */
  uptime?: number;
  /** Instance ID for clustering */
  instanceId?: number;
  /** Cluster group name */
  clusterGroup?: string;
  /** Health status */
  healthy?: boolean;
}

/**
 * Instance information for clustering
 */
export interface InstanceInfo {
  /** Instance ID */
  id: number;
  /** Process name */
  name: string;
  /** Current number of active connections */
  connections: number;
  /** CPU usage percentage */
  cpu: number;
  /** Memory usage in bytes */
  memory: number;
  /** Weight for weighted load balancing */
  weight: number;
  /** Whether the instance is healthy */
  healthy: boolean;
  /** Current state */
  state?: string;
  /** PID */
  pid?: number;
  /** Start time */
  startedAt?: number;
}

/**
 * Cluster information
 */
export interface ClusterInfo {
  /** Cluster name */
  name: string;
  /** Total instances */
  totalInstances: number;
  /** Running instances */
  runningInstances: number;
  /** Healthy instances */
  healthyInstances: number;
  /** Load balancing strategy */
  strategy: string;
  /** Instances */
  instances: InstanceInfo[];
}

/**
 * Process group information
 */
export interface ProcessGroup {
  /** Group name */
  name: string;
  /** Namespace */
  namespace: string;
  /** Number of processes in group */
  processCount: number;
  /** Total instances across all processes */
  totalInstances: number;
  /** Processes in this group */
  processNames: string[];
}
