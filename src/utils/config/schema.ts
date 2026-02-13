/**
 * Configuration Schema and Validation
 * Defines types and validation for TSPM process configuration using ArkType
 * @module utils/config/schema
 */

import { type } from "arktype";

/**
 * ArkType Schema for Process configuration
 */
export const processConfigSchema = type({
  /** Unique name for the process */
  name: "string > 0",
  /** Script or command to run */
  script: "string > 0",
  /** Command line arguments */
  "args?": "string[]",
  /** Environment variables */
  "env?": "Record<string, string>",
  /** Current working directory */
  "cwd?": "string",
  /** Auto-restart on exit (default: true) */
  "autorestart?": "boolean",
  /** Watch files for changes and restart */
  "watch?": "boolean | string[]",
  /** Ignore patterns for watch mode */
  "ignoreWatch?": "string[]",
  /** Maximum restart attempts */
  "maxRestarts?": "number",
  /** Delay between restarts in ms (default: exponential backoff) */
  "restartDelay?": "number",
  /** Standard output log file path */
  "stdout?": "string",
  /** Standard error log file path */
  "stderr?": "string",
  /** Combine stdout and stderr */
  "combineLogs?": "boolean",
  /** Log timestamp format */
  "logDateFormat?": "string",
  /** Instances count (for clustering) */
  "instances?": "number",
  /** Execute as cron job */
  "cron?": "string",
  /** Kill process on stop signal */
  "killTimeout?": "number",
  /** Process user (Unix only) */
  "user?": "string",
  /** Process group (Unix only) */
  "group?": "string",
});

/**
 * Process configuration options inferred from schema
 */
export type ProcessConfig = typeof processConfigSchema.infer;

/**
 * ArkType Schema for TSPM configuration
 */
export const tspmConfigSchema = type({
  /** Array of process configurations */
  processes: processConfigSchema.array(),
  /** Default settings applied to all processes */
  "defaults?": processConfigSchema.partial(),
  /** Log directory for all processes */
  "logDir?": "string",
  /** PID file directory */
  "pidDir?": "string",
});

/**
 * TSPM configuration file structure inferred from schema
 */
export type TSPMConfig = typeof tspmConfigSchema.infer;

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field path that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: "error" | "warning";
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
  const result = processConfigSchema(config);
  const prefix = index !== undefined ? `processes[${index}]` : "process";

  if (result instanceof type.errors) {
    return result.map((error) => ({
      field: error.path.length > 0 ? `${prefix}.${error.path.join(".")}` : prefix,
      message: error.message,
      severity: "error",
    }));
  }

  return [];
}

/**
 * Validate full TSPM configuration
 *
 * @param config - Configuration object to validate
 * @returns Validation result with errors and warnings
 */
export function validateConfig(config: unknown): ValidationResult {
  const result = tspmConfigSchema(config);

  if (result instanceof type.errors) {
    const errors: ValidationError[] = result.map((error) => ({
      field: error.path.join("."),
      message: error.message,
      severity: "error",
    }));

    return {
      valid: false,
      errors,
      warnings: [],
    };
  }

  // Check for duplicate process names (ArkType doesn't easily do this natively without custom morphs)
  const errors: ValidationError[] = [];
  const cfg = config as TSPMConfig;
  const processNames = new Set<string>();

  if (cfg.processes && Array.isArray(cfg.processes)) {
    cfg.processes.forEach((proc, i) => {
      if (proc.name && processNames.has(proc.name)) {
        errors.push({
          field: `processes[${i}].name`,
          message: `Duplicate process name: ${proc.name}`,
          severity: "error",
        });
      }
      processNames.add(proc.name);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
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
  } as ProcessConfig;
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
    processes: config.processes.map((proc) => applyDefaults(proc, defaults)),
  };
}
