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
  EXIT_CODES,
  SIGNALS,
  ENV_VARS,
  RESTART_CONFIG,
  WATCH_CONFIG,
  LOG_CONFIG,
} from '../utils/config/constants';

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
  state?: 'starting' | 'running' | 'stopping' | 'stopped' | 'errored' | 'restarting';
  /** Number of restart attempts */
  restartCount?: number;
  /** Process uptime in milliseconds */
  uptime?: number;
}
