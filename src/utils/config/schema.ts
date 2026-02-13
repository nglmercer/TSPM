/**
 * Configuration Schema and Validation
 * Defines types and validation for TSPM process configuration using ArkType
 * @module utils/config/schema
 */

import { type } from 'arktype';
import { 
  ErrorSeverityValues, 
  type ErrorSeverity,
  DEFAULT_PROCESS_CONFIG 
} from './constants';


/**
 * Health check configuration schema
 */
const HealthCheckConfigSchema = type({
  /** Enable health checks */
  'enabled?': 'boolean',
  /** Health check protocol */
  'protocol?': 'string',
  /** Health check URL or path */
  'url?': 'string',
  /** Health check host */
  'host?': 'string',
  /** Health check port */
  'port?': 'number',
  /** Health check path (for HTTP) */
  'path?': 'string',
  /** HTTP method */
  'method?': 'string',
  /** Health check timeout in ms */
  'timeout?': 'number>=0',
  /** Interval between health checks in ms */
  'interval?': 'number>=0',
  /** Number of consecutive failures before marking unhealthy */
  'retries?': 'number>=0',
  /** Initial delay before starting health checks in ms */
  'initialDelay?': 'number>=0',
  /** Command to execute for command-based checks */
  'command?': 'string',
  /** Expected status code for HTTP checks */
  'expectedStatus?': 'number',
  /** Response body to match */
  'responseBody?': 'string',
});

/**
 * ArkType schema for process configuration
 */
export const ProcessConfigSchema = type({
  /** Unique name for the process */
  'name': 'string>0',
  /** Script or command to run */
  'script': 'string>0',
  /** Command line arguments */
  'args?': 'string[]',
  /** Environment variables */
  'env?': 'Record<string, string>',
  /** Current working directory */
  'cwd?': 'string',
  /** Auto-restart on exit (default: true) */
  'autorestart?': 'boolean',
  /** Watch files for changes and restart */
  'watch?': 'boolean | string[]',
  /** Ignore patterns for watch mode */
  'ignoreWatch?': 'string[]',
  /** Maximum restart attempts */
  'maxRestarts?': 'number>=0',
  /** Delay between restarts in ms (default: exponential backoff) */
  'restartDelay?': 'number>=0',
  /** Standard output log file path */
  'stdout?': 'string',
  /** Standard error log file path */
  'stderr?': 'string',
  /** Combine stdout and stderr */
  'combineLogs?': 'boolean',
  /** Log timestamp format */
  'logDateFormat?': 'string',
  /** Instances count (for clustering) */
  'instances?': 'number>=0',
  /** Execute as cron job */
  'cron?': 'string',
  /** Kill process on stop signal */
  'killTimeout?': 'number>=0',
  /** Process namespace/group */
  'namespace?': 'string',
  /** Process user (Unix only) */
  'user?': 'string',
  /** Process group (Unix only) */
  'group?': 'string',
  /** Load balancing strategy for clustered instances */
  'lbStrategy?': 'string',
  /** Instance weight for weighted load balancing */
  'instanceWeight?': 'number>=0',
  /** Health check configuration */
  'healthCheck?': HealthCheckConfigSchema,
  /** Instance ID (auto-assigned) */
  'instanceId?': 'number>=0',
  /** Cluster group name */
  'clusterGroup?': 'string',
});

/**
 * Process configuration type inferred from ArkType schema
 */
export type ProcessConfig = typeof ProcessConfigSchema.infer;

/**
 * ArkType schema for TSPM configuration file structure
 */
export const TSPMConfigSchema = type({
  /** Array of process configurations */
  'processes': ProcessConfigSchema.array(),
  /** Default settings applied to all processes */
  'defaults?': ProcessConfigSchema.partial(),
  /** Default namespace for all processes */
  'namespace?': 'string',
  /** Log directory for all processes */
  'logDir?': 'string',
  /** PID file directory */
  'pidDir?': 'string',
});

/**
 * TSPM configuration type inferred from ArkType schema
 */
export type TSPMConfig = typeof TSPMConfigSchema.infer;

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
 * Convert ArkType error path to field string
 */
function pathToField(path: readonly PropertyKey[]): string {
  return path
    .filter((p): p is string | number => typeof p === 'string' || typeof p === 'number')
    .map(p => typeof p === 'number' ? `[${p}]` : `.${p}`)
    .join('')
    .replace(/^\./, '');
}

/**
 * Validate a single process configuration using ArkType
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
  
  // Use ArkType validation
  const result = ProcessConfigSchema(config);
  
  if (result instanceof type.errors) {
    for (const problem of result) {
      const fieldPath = prefix + (problem.path.length > 0 ? '.' + pathToField(problem.path) : '');
      errors.push({
        field: fieldPath || prefix,
        message: problem.message,
        severity: ErrorSeverityValues.ERROR,
      });
    }
  }
  
  // Additional validation: process name format (warning)
  if (config && typeof config === 'object' && config !== null) {
    const proc = config as Record<string, unknown>;
    if (typeof proc.name === 'string' && proc.name.trim() !== '') {
      if (!/^[a-zA-Z0-9_-]+$/.test(proc.name as string)) {
        errors.push({
          field: `${prefix}.name`,
          message: 'Process name can only contain letters, numbers, underscores, and hyphens',
          severity: ErrorSeverityValues.WARNING,
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate full TSPM configuration using ArkType
 *
 * @param config - Configuration object to validate
 * @returns Validation result with errors and warnings
 */
export function validateConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Use ArkType validation for the main config structure
  const result = TSPMConfigSchema(config);
  
  if (result instanceof type.errors) {
    for (const problem of result) {
      const fieldPath = problem.path.length > 0 ? pathToField(problem.path) : 'root';
      errors.push({
        field: fieldPath,
        message: problem.message,
        severity: ErrorSeverityValues.ERROR,
      });
    }
    return { valid: false, errors, warnings };
  }
  
  // Additional validation: check for duplicate process names
  const processNames = new Set<string>();
  for (let i = 0; i < result.processes.length; i++) {
    const proc = result.processes[i]!;
    
    // Validate each process with detailed validation
    const procErrors = validateProcessConfig(proc, i);
    
    for (const error of procErrors) {
      if (error.severity === ErrorSeverityValues.ERROR) {
        errors.push(error);
      } else {
        warnings.push(error);
      }
    }
    
    // Check for duplicate names
    if (proc.name) {
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
  if (result.defaults) {
    const defaultErrors = validateProcessConfig(result.defaults, undefined);
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
 * Type guard to check if a value is a valid ProcessConfig
 */
export function isProcessConfig(value: unknown): value is ProcessConfig {
  return !(ProcessConfigSchema(value) instanceof type.errors);
}

/**
 * Type guard to check if a value is a valid TSPMConfig
 */
export function isTSPMConfig(value: unknown): value is TSPMConfig {
  return !(TSPMConfigSchema(value) instanceof type.errors);
}

/**
 * Assert that a value is a valid ProcessConfig
 * @throws Error if validation fails
 */
export function assertProcessConfig(value: unknown): asserts value is ProcessConfig {
  const result = ProcessConfigSchema(value);
  if (result instanceof type.errors) {
    throw new Error(`Invalid ProcessConfig: ${result.summary}`);
  }
}

/**
 * Assert that a value is a valid TSPMConfig
 * @throws Error if validation fails
 */
export function assertTSPMConfig(value: unknown): asserts value is TSPMConfig {
  const result = TSPMConfigSchema(value);
  if (result instanceof type.errors) {
    throw new Error(`Invalid TSPMConfig: ${result.summary}`);
  }
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
    processes: config.processes.map((proc: ProcessConfig) => applyDefaults(proc, defaults)),
  };
}

/**
 * Parse and validate configuration from unknown input
 * Returns the validated config or throws an error
 *
 * @param config - Unknown configuration input
 * @returns Validated TSPMConfig
 * @throws Error if validation fails
 */
export function parseConfig(config: unknown): TSPMConfig {
  const result = TSPMConfigSchema(config);
  if (result instanceof type.errors) {
    throw new Error(`Configuration validation failed: ${result.summary}`);
  }
  return result;
}

/**
 * Parse and validate process configuration from unknown input
 * Returns the validated config or throws an error
 *
 * @param config - Unknown process configuration input
 * @returns Validated ProcessConfig
 * @throws Error if validation fails
 */
export function parseProcessConfig(config: unknown): ProcessConfig {
  const result = ProcessConfigSchema(config);
  if (result instanceof type.errors) {
    throw new Error(`Process configuration validation failed: ${result.summary}`);
  }
  return result;
}
