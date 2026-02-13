/**
 * Configuration Schema and Validation
 * Defines types and validation for TSPM process configuration
 * @module utils/config/schema
 */

import { 
  ErrorSeverityValues, 
  type ErrorSeverity,
  DEFAULT_PROCESS_CONFIG 
} from './constants';

/**
 * Process configuration options
 */
export interface ProcessConfig {
  /** Unique name for the process */
  name: string;
  /** Script or command to run */
  script: string;
  /** Command line arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Current working directory */
  cwd?: string;
  /** Auto-restart on exit (default: true) */
  autorestart?: boolean;
  /** Watch files for changes and restart */
  watch?: boolean | string[];
  /** Ignore patterns for watch mode */
  ignoreWatch?: string[];
  /** Maximum restart attempts */
  maxRestarts?: number;
  /** Delay between restarts in ms (default: exponential backoff) */
  restartDelay?: number;
  /** Standard output log file path */
  stdout?: string;
  /** Standard error log file path */
  stderr?: string;
  /** Combine stdout and stderr */
  combineLogs?: boolean;
  /** Log timestamp format */
  logDateFormat?: string;
  /** Instances count (for clustering) */
  instances?: number;
  /** Execute as cron job */
  cron?: string;
  /** Kill process on stop signal */
  killTimeout?: number;
  /** Process namespace/group */
  namespace?: string;
  /** Process user (Unix only) */
  user?: string;
  /** Process group (Unix only) */
  group?: string;
}

/**
 * TSPM configuration file structure
 */
export interface TSPMConfig {
  /** Array of process configurations */
  processes: ProcessConfig[];
  /** Default settings applied to all processes */
  defaults?: Partial<ProcessConfig>;
  /** Default namespace for all processes */
  namespace?: string;
  /** Log directory for all processes */
  logDir?: string;
  /** PID file directory */
  pidDir?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field path that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: ErrorSeverity;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationError[];
}

/**
 * Required fields for process configuration
 */
const REQUIRED_PROCESS_FIELDS: (keyof ProcessConfig)[] = ['name', 'script'];

/**
 * Validate a single process configuration
 *
 * @param config - Process configuration to validate
 * @param index - Index in the processes array (for error messages)
 * @returns Validation errors and warnings
 */
export function validateProcessConfig(
  config: unknown,
  index?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  const prefix = index !== undefined ? `processes[${index}]` : 'process';
  
  if (!config || typeof config !== 'object') {
    errors.push({
      field: prefix,
      message: 'Process configuration must be an object',
      severity: ErrorSeverityValues.ERROR,
    });
    return errors;
  }
  
  const proc = config as Record<string, unknown>;
  
  // Check required fields
  for (const field of REQUIRED_PROCESS_FIELDS) {
    if (proc[field] === undefined || proc[field] === null) {
      errors.push({
        field: `${prefix}.${field}`,
        message: `Required field '${field}' is missing`,
        severity: ErrorSeverityValues.ERROR,
      });
    }
  }
  
  // Validate name
  if (typeof proc.name !== 'undefined') {
    if (typeof proc.name !== 'string' || proc.name.trim() === '') {
      errors.push({
        field: `${prefix}.name`,
        message: 'Process name must be a non-empty string',
        severity: ErrorSeverityValues.ERROR,
      });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(proc.name as string)) {
      errors.push({
        field: `${prefix}.name`,
        message: 'Process name can only contain letters, numbers, underscores, and hyphens',
        severity: ErrorSeverityValues.WARNING,
      });
    }
  }
  
  // Validate script
  if (typeof proc.script !== 'undefined') {
    if (typeof proc.script !== 'string' || proc.script.trim() === '') {
      errors.push({
        field: `${prefix}.script`,
        message: 'Script must be a non-empty string',
        severity: ErrorSeverityValues.ERROR,
      });
    }
  }
  
  // Validate args
  if (typeof proc.args !== 'undefined') {
    if (!Array.isArray(proc.args) || !proc.args.every(a => typeof a === 'string')) {
      errors.push({
        field: `${prefix}.args`,
        message: 'Args must be an array of strings',
        severity: ErrorSeverityValues.ERROR,
      });
    }
  }
  
  // Validate env
  if (typeof proc.env !== 'undefined') {
    if (typeof proc.env !== 'object' || proc.env === null) {
      errors.push({
        field: `${prefix}.env`,
        message: 'Env must be an object',
        severity: ErrorSeverityValues.ERROR,
      });
    } else {
      const env = proc.env as Record<string, unknown>;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value !== 'string') {
          errors.push({
            field: `${prefix}.env.${key}`,
            message: 'Environment variable values must be strings',
            severity: ErrorSeverityValues.WARNING,
          });
        }
      }
    }
  }
  
  // Validate numeric fields
  const numericFields: (keyof ProcessConfig)[] = ['maxRestarts', 'restartDelay', 'instances', 'killTimeout'];
  for (const field of numericFields) {
    if (typeof proc[field] !== 'undefined') {
      if (typeof proc[field] !== 'number' || (proc[field] as number) < 0) {
        errors.push({
          field: `${prefix}.${field}`,
          message: `${field} must be a non-negative number`,
          severity: ErrorSeverityValues.ERROR,
        });
      }
    }
  }
  
  // Validate boolean fields
  const booleanFields: (keyof ProcessConfig)[] = ['autorestart', 'combineLogs'];
  for (const field of booleanFields) {
    if (typeof proc[field] !== 'undefined' && typeof proc[field] !== 'boolean') {
      errors.push({
        field: `${prefix}.${field}`,
        message: `${field} must be a boolean`,
        severity: ErrorSeverityValues.ERROR,
      });
    }
  }
  
  // Validate watch
  if (typeof proc.watch !== 'undefined') {
    if (typeof proc.watch !== 'boolean' && !Array.isArray(proc.watch)) {
      errors.push({
        field: `${prefix}.watch`,
        message: 'Watch must be a boolean or an array of paths',
        severity: ErrorSeverityValues.ERROR,
      });
    }
  }
  
  // Validate ignoreWatch
  if (typeof proc.ignoreWatch !== 'undefined') {
    if (!Array.isArray(proc.ignoreWatch) || !proc.ignoreWatch.every(w => typeof w === 'string')) {
      errors.push({
        field: `${prefix}.ignoreWatch`,
        message: 'ignoreWatch must be an array of strings',
        severity: ErrorSeverityValues.ERROR,
      });
    }
  }
  
  return errors;
}

/**
 * Validate full TSPM configuration
 *
 * @param config - Configuration object to validate
 * @returns Validation result with errors and warnings
 */
export function validateConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: [{
        field: 'root',
        message: 'Configuration must be an object',
        severity: ErrorSeverityValues.ERROR,
      }],
      warnings: [],
    };
  }
  
  const cfg = config as Record<string, unknown>;
  
  // Check for processes array
  if (!Array.isArray(cfg.processes)) {
    errors.push({
      field: 'processes',
      message: 'Configuration must have a "processes" array',
      severity: ErrorSeverityValues.ERROR,
    });
    return { valid: false, errors, warnings };
  }
  
  // Validate each process
  const processNames = new Set<string>();
  for (let i = 0; i < cfg.processes.length; i++) {
    const procErrors = validateProcessConfig(cfg.processes[i], i);
    
    for (const error of procErrors) {
      if (error.severity === ErrorSeverityValues.ERROR) {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    }
    
    // Check for duplicate names
    const proc = cfg.processes[i] as Record<string, unknown>;
    if (typeof proc.name === 'string') {
      if (processNames.has(proc.name)) {
        errors.push({
          field: `processes[${i}].name`,
          message: `Duplicate process name: ${proc.name}`,
          severity: ErrorSeverityValues.ERROR,
        });
      } else {
        processNames.add(proc.name);
      }
    }
  }
  
  // Validate defaults if present
  if (cfg.defaults) {
    const defaultErrors = validateProcessConfig(cfg.defaults, undefined);
    for (const error of defaultErrors) {
      if (error.severity === ErrorSeverityValues.ERROR) {
        warnings.push({
          ...error,
          message: `Defaults: ${error.message}`,
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Apply defaults to process configuration
 *
 * @param process - Process configuration
 * @param defaults - Default values to apply
 * @returns Process configuration with defaults applied
 */
export function applyDefaults(
  process: ProcessConfig,
  defaults?: Partial<ProcessConfig>
): ProcessConfig {
  if (!defaults) return process;

  return {
    ...defaults,
    ...process,
    env: {
      ...defaults.env,
      ...process.env,
    },
  };
}

/**
 * Normalize process configuration
 * Ensures all optional fields have sensible defaults
 *
 * @param config - TSPM configuration
 * @returns Normalized configuration
 */
export function normalizeConfig(config: TSPMConfig): TSPMConfig {
  const defaults: Partial<ProcessConfig> = {
    autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
    maxRestarts: DEFAULT_PROCESS_CONFIG.maxRestarts,
    killTimeout: DEFAULT_PROCESS_CONFIG.killTimeout,
    namespace: config.namespace || 'default',
    ...config.defaults,
  };

  return {
    ...config,
    processes: config.processes.map((proc) => applyDefaults(proc, defaults)),
  };
}
