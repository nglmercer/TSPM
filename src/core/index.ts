/**
 * TSPM Core Module
 * 
 * This is the main entry point for the core functionality.
 * Export all public APIs from here for convenient importing.
 */

// Types
export type {
  ProcessConfig,
  TSPMConfig,
  ValidationResult,
  ValidationError,
  ProcessStatus,
} from "./types";

// Constants
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
} from "./types";

// Config utilities
export {
  ConfigManager,
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  getConfigManager,
  loadConfig,
  validateConfig,
  validateProcessConfig,
  normalizeConfig,
  applyDefaults,
} from "./types";

// Classes
export { ConfigLoader } from "./ConfigLoader";
export { ManagedProcess } from "./ManagedProcess";
export { ProcessManager } from "./ProcessManager";
