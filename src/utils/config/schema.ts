/**
 * Configuration Schema and Validation
 * Defines types and validation for TSPM process configuration
 * @module utils/config/schema
 */

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
  severity: 'error' | 'warning';
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
const REQUIRED_FIELDS: (keyof ProcessConfig)[] = ['name', 'script'];

/**
 * Valid process config keys for validation
 */
const VALID_PROCESS_KEYS: (keyof ProcessConfig)[] = [
  'name', 'script', 'args', 'env', 'cwd', 'autorestart', 
  'watch', 'ignoreWatch', 'maxRestarts', 'restartDelay',
  'stdout', 'stderr', 'combineLogs', 'logDateFormat',
  'instances', 'cron', 'killTimeout', 'user', 'group'
];

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
      severity: 'error',
    });
    return errors;
  }
  
  const proc = config as Record<string, unknown>;
  
  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (proc[field] === undefined || proc[field] === null) {
      errors.push({
        field: `${prefix}.${field}`,
        message: `Required field '${field}' is missing`,
        severity: 'error',
      });
    }
  }
  
  // Validate name
  if (typeof proc.name !== 'undefined') {
    if (typeof proc.name !== 'string' || proc.name.trim() === '') {
      errors.push({
        field: `${prefix}.name`,
        message: 'Process name must be a non-empty string',
        severity: 'error',
      });
    } else if (!/^[a-zA-Z0-9_-]+$/.test(proc.name)) {
      errors.push({
        field: `${prefix}.name`,
        message: 'Process name can only contain letters, numbers, underscores, and hyphens',
        severity: 'warning',
      });
    }
  }
  
  // Validate script
  if (typeof proc.script !== 'undefined') {
    if (typeof proc.script !== 'string' || proc.script.trim() === '') {
      errors.push({
        field: `${prefix}.script`,
        message: 'Script must be a non-empty string',
        severity: 'error',
      });
    }
  }
  
  // Validate args
  if (typeof proc.args !== 'undefined') {
    if (!Array.isArray(proc.args) || !proc.args.every(a => typeof a === 'string')) {
      errors.push({
        field: `${prefix}.args`,
        message: 'Args must be an array of strings',
        severity: 'error',
      });
    }
  }
  
  // Validate env
  if (typeof proc.env !== 'undefined') {
    if (typeof proc.env !== 'object' || proc.env === null) {
      errors.push({
        field: `${prefix}.env`,
        message: 'Env must be an object',
        severity: 'error',
      });
    } else {
      const env = proc.env as Record<string, unknown>;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value !== 'string') {
          errors.push({
            field: `${prefix}.env.${key}`,
            message: 'Environment variable values must be strings',
            severity: 'warning',
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
          severity: 'error',
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
        severity: 'error',
      });
    }
  }
  
  // Validate watch
  if (typeof proc.watch !== 'undefined') {
    if (typeof proc.watch !== 'boolean' && !Array.isArray(proc.watch)) {
      errors.push({
        field: `${prefix}.watch`,
        message: 'Watch must be a boolean or an array of paths',
        severity: 'error',
      });
    }
  }
  
  // Validate ignoreWatch
  if (typeof proc.ignoreWatch !== 'undefined') {
    if (!Array.isArray(proc.ignoreWatch) || !proc.ignoreWatch.every(w => typeof w === 'string')) {
      errors.push({
        field: `${prefix}.ignoreWatch`,
        message: 'ignoreWatch must be an array of strings',
        severity: 'error',
      });
    }
  }
  
  // Check for unknown fields
  for (const key of Object.keys(proc)) {
    if (!VALID_PROCESS_KEYS.includes(key as keyof ProcessConfig)) {
      errors.push({
        field: `${prefix}.${key}`,
        message: `Unknown field '${key}' will be ignored`,
        severity: 'warning',
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
        severity: 'error',
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
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }
  
  // Validate each process
  const processNames = new Set<string>();
  for (let i = 0; i < cfg.processes.length; i++) {
    const procErrors = validateProcessConfig(cfg.processes[i], i);
    
    for (const error of procErrors) {
      if (error.severity === 'error') {
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
          severity: 'error',
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
      if (error.severity === 'error') {
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
    autorestart: true,
    maxRestarts: 10,
    killTimeout: 5000,
    ...config.defaults,
  };
  
  return {
    ...config,
    processes: config.processes.map(proc => applyDefaults(proc, defaults)),
  };
}
