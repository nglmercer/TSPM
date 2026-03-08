/**
 * Configuration Schema and Validation
 * Defines types and validation for TSPM process configuration using ArkType
 * @module utils/config/schema
 */

import { type } from 'arktype';
import { 
  ErrorSeverityValues, 
  type ErrorSeverity,
  DEFAULT_PROCESS_CONFIG,
  getDefaultLogPath,
  getDefaultErrLogPath
} from './constants';

/**
 * Webhook configuration schema
 */
const WebhookConfigSchema = type({
  /** Webhook URL */
  'url': 'string>0',
  /** Events to trigger this webhook */
  'events?': 'string[]',
  /** HTTP headers to send */
  'headers?': 'Record<string, string>',
  /** Whether the webhook is enabled */
  'enabled?': 'boolean',
});


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
 * Kubernetes configuration schema for container orchestration hints
 */
const KubernetesConfigSchema = type({
  /** Enable Kubernetes mode */
  'enabled?': 'boolean',
  /** Pod name */
  'podName?': 'string',
  /** Pod namespace */
  'podNamespace?': 'string',
  /** Pod labels */
  'labels?': 'Record<string, string>',
  /** Pod annotations */
  'annotations?': 'Record<string, string>',
  /** Container name */
  'containerName?': 'string',
  /** Liveness probe path */
  'livenessProbe?': 'string',
  /** Readiness probe path */
  'readinessProbe?': 'string',
  /** Start-up probe path */
  'startupProbe?': 'string',
});

/**
 * Docker configuration schema for container hints
 */
const DockerConfigSchema = type({
  /** Enable Docker mode */
  'enabled?': 'boolean',
  /** Container name */
  'containerName?': 'string',
  /** Container labels */
  'labels?': 'Record<string, string>',
  /** Restart policy */
  'restartPolicy?': 'string',
  /** Memory limit */
  'memoryLimit?': 'string',
  /** CPU limit */
  'cpuLimit?': 'string',
});

/**
 * Deployment environment configuration schema
 */
const DeploymentEnvConfigSchema = type({
  /** Remote host (IP or hostname) */
  'host': 'string>0',
  /** SSH user */
  'user': 'string>0',
  /** SSH port */
  'port?': 'number>=0',
  /** SSH key path */
  'key?': 'string',
  /** Remote path where to deploy */
  'path': 'string>0',
  /** Pre-deploy commands/hooks */
  'preDeploy?': 'string | string[]',
  /** Post-deploy commands/hooks */
  'postDeploy?': 'string | string[]',
  /** Environment variables for deployment */
  'env?': 'Record<string, string>',
  /** Git reference (branch/tag/commit) to deploy */
  'ref?': 'string',
});

/**
 * Deployment configuration schema
 */
const DeploymentConfigSchema = type({
  /** Git repository URL */
  'repo?': 'string',
  /** Deployment environments (staging, production, etc.) */
  'environments?': 'Record<string, unknown>',
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
  /** Interpreter to use (e.g. bun, node, python) */
  'interpreter?': 'string',
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
  /** Minimum delay between restarts in ms */
  'minRestartDelay?': 'number>=0',
  /** Maximum delay between restarts in ms */
  'maxRestartDelay?': 'number>=0',
  /** Restart backoff multiplier */
  'restartBackoff?': 'number>=1',
  /** Delay between restarts in ms (default: exponential backoff) */
  'restartDelay?': 'number>=0',
  /** Standard output log file path */
  'stdout?': 'string',
  /** Standard error log file path */
  'stderr?': 'string',
  /** Combine stdout and stderr */
  'combineLogs?': 'boolean',
  /** Merge logs from all instances (for clustering) */
  'mergeLogs?': 'boolean',
  /** Log timestamp format */
  'logDateFormat?': 'string',
  /** Instances count (for clustering) */
  'instances?': 'number>=0',
  /** Execute as cron job */
  'cron?': 'string',
  /** Kill process on stop signal (ms) */
  'killTimeout?': 'number>=0',
  /** Timeout for listen event - wait for app to be ready (ms) */
  'listenTimeout?': 'number>=0',
  /** Wait for ready signal from app before marking as started */
  'waitReady?': 'boolean',
  /** Process namespace/group */
  'namespace?': 'string',
  /** Process user (Unix only) */
  'user?': 'string',
  /** Process group (Unix only) */
  'group?': 'string',
  /** Process priority (nice value, -20 to 19) */
  'nice?': 'number',
  /** Load balancing strategy for clustered instances */
  'lbStrategy?': 'string',
  /** Instance weight for weighted load balancing */
  'instanceWeight?': 'number>=0',
  /** Environment variable name for instance ID */
  'instanceVar?': 'string',
  /** Health check configuration */
  'healthCheck?': HealthCheckConfigSchema,
  /** Instance ID (auto-assigned) */
  'instanceId?': 'number>=0',
  /** Cluster group name */
  'clusterGroup?': 'string',
  /** Dotenv file path */
  'dotEnv?': 'string',
  /** Script to run before starting the process */
  'preStart?': 'string',
  /** Script to run to install dependencies */
  'install?': 'string',
  /** Script to run to build the project */
  'build?': 'string',
  /** Script to run after the process has started */
  'postStart?': 'string',
  /** Maximum memory in bytes before auto-restart (OOM) */
  'maxMemory?': 'number>=0',
  /** Minimum uptime in ms before considering restart successful */
  'minUptime?': 'number>=0',
  /** Watch delay in ms (debounce time for file changes) */
  'watchDelay?': 'number>=0',
  /** Process labels for metadata */
  'labels?': 'Record<string, string>',
  /** Process annotations for metadata */
  'annotations?': 'Record<string, string>',
  /** Kubernetes configuration */
  'kubernetes?': KubernetesConfigSchema,
  /** Docker configuration */
  'docker?': DockerConfigSchema,
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
  /** Webhook notifications */
  'webhooks?': WebhookConfigSchema.array(),
  /** Enable structured JSON logging */
  'structuredLogging?': 'boolean',
  /** API configuration */
  'api?': {
    'enabled?': 'boolean',
    'port?': 'number',
    'host?': 'string',
  },
  /** Deployment configuration */
  'deploy?': DeploymentConfigSchema,
});

/**
 * TSPM configuration type inferred from ArkType schema
 */
export type TSPMConfig = typeof TSPMConfigSchema.infer;

/**
 * Form field configuration for web UI
 */
export interface FormFieldConfig {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'string[]' | 'Record';
    required: boolean;
    label: string;
    placeholder?: string;
    description?: string;
    defaultValue?: unknown;
    options?: { value: string; label: string }[];
    group?: string;
}

/**
 * Get form fields for process configuration (client-friendly export)
 * This returns a JSON-serializable array of form field configurations
 * that can be used to generate forms on the web client
 */
export function getProcessConfigFormFields(): FormFieldConfig[] {
    return [
        // Basic Info
        {
            name: 'name',
            type: 'string',
            required: true,
            label: 'Name',
            placeholder: 'my-awesome-api',
            description: 'Unique name for the process',
            group: 'basic'
        },
        {
            name: 'script',
            type: 'string',
            required: true,
            label: 'Script, Command or Binary',
            placeholder: './src/index.ts or bun run start',
            description: 'Script or command to run',
            group: 'basic'
        },
        {
            name: 'args',
            type: 'string[]',
            required: false,
            label: 'Arguments',
            placeholder: '--port 8080 --debug',
            description: 'Command line arguments (space-separated)',
            group: 'basic'
        },
        {
            name: 'interpreter',
            type: 'string',
            required: false,
            label: 'Interpreter',
            description: 'Interpreter to use',
            options: [
                { value: '', label: 'Auto-detect' },
                { value: 'bun', label: 'Bun' },
                { value: 'node', label: 'Node' },
                { value: 'python', label: 'Python' },
                { value: 'sh', label: 'Shell (sh)' },
                { value: 'none', label: 'None (Binary)' }
            ],
            group: 'basic'
        },
        
        // Runtime
        {
            name: 'instances',
            type: 'number',
            required: false,
            label: 'Instances',
            placeholder: '1',
            description: 'Number of instances for clustering',
            defaultValue: 1,
            group: 'runtime'
        },
        {
            name: 'cwd',
            type: 'string',
            required: false,
            label: 'Working Directory',
            placeholder: '/path/to/project',
            description: 'Current working directory',
            group: 'runtime'
        },
        {
            name: 'namespace',
            type: 'string',
            required: false,
            label: 'Namespace',
            placeholder: 'production',
            description: 'Process namespace/group',
            group: 'runtime'
        },
        
        // Restart Behavior
        {
            name: 'autorestart',
            type: 'boolean',
            required: false,
            label: 'Auto-restart',
            description: 'Automatically restart on exit',
            defaultValue: true,
            group: 'restart'
        },
        {
            name: 'maxRestarts',
            type: 'number',
            required: false,
            label: 'Max Restarts',
            placeholder: '10',
            description: 'Maximum restart attempts before giving up',
            defaultValue: 10,
            group: 'restart'
        },
        {
            name: 'minRestartDelay',
            type: 'number',
            required: false,
            label: 'Min Restart Delay (ms)',
            placeholder: '100',
            description: 'Minimum delay between restarts in ms',
            defaultValue: 100,
            group: 'restart'
        },
        {
            name: 'maxRestartDelay',
            type: 'number',
            required: false,
            label: 'Max Restart Delay (ms)',
            placeholder: '30000',
            description: 'Maximum delay between restarts in ms',
            defaultValue: 30000,
            group: 'restart'
        },
        {
            name: 'minUptime',
            type: 'number',
            required: false,
            label: 'Min Uptime (ms)',
            placeholder: '0',
            description: 'Minimum uptime in ms before considering restart successful',
            defaultValue: 0,
            group: 'restart'
        },
        
        // Watch Mode
        {
            name: 'watch',
            type: 'boolean',
            required: false,
            label: 'Watch Files',
            description: 'Watch files for changes and restart',
            defaultValue: false,
            group: 'watch'
        },
        {
            name: 'watchDelay',
            type: 'number',
            required: false,
            label: 'Watch Delay (ms)',
            placeholder: '100',
            description: 'Debounce time for file changes',
            defaultValue: 100,
            group: 'watch'
        },
        {
            name: 'ignoreWatch',
            type: 'string[]',
            required: false,
            label: 'Ignore Watch Patterns',
            placeholder: 'node_modules dist',
            description: 'Patterns to ignore in watch mode (space-separated)',
            group: 'watch'
        },
        
        // Lifecycle Scripts
        {
            name: 'install',
            type: 'string',
            required: false,
            label: 'Install Script',
            placeholder: 'bun install',
            description: 'Script to run to install dependencies',
            group: 'lifecycle'
        },
        {
            name: 'build',
            type: 'string',
            required: false,
            label: 'Build Script',
            placeholder: 'bun run build',
            description: 'Script to run to build the project',
            group: 'lifecycle'
        },
        {
            name: 'preStart',
            type: 'string',
            required: false,
            label: 'Pre-start Script',
            placeholder: 'echo "Starting..."',
            description: 'Script to run before starting the process',
            group: 'lifecycle'
        },
        {
            name: 'postStart',
            type: 'string',
            required: false,
            label: 'Post-start Script',
            placeholder: 'echo "Started!"',
            description: 'Script to run after the process has started',
            group: 'lifecycle'
        },
        
        // Timeouts
        {
            name: 'killTimeout',
            type: 'number',
            required: false,
            label: 'Kill Timeout (ms)',
            placeholder: '5000',
            description: 'Time to wait after stop signal before killing',
            defaultValue: 5000,
            group: 'timeouts'
        },
        {
            name: 'listenTimeout',
            type: 'number',
            required: false,
            label: 'Listen Timeout (ms)',
            placeholder: '0',
            description: 'Time to wait for app to be ready',
            defaultValue: 0,
            group: 'timeouts'
        },
        {
            name: 'waitReady',
            type: 'boolean',
            required: false,
            label: 'Wait for Ready',
            description: 'Wait for ready signal from app before marking as started',
            defaultValue: false,
            group: 'timeouts'
        },
        
        // Logging
        {
            name: 'stdout',
            type: 'string',
            required: false,
            label: 'Stdout Log Path',
            placeholder: 'logs/app.log',
            description: 'Standard output log file path',
            group: 'logging'
        },
        {
            name: 'stderr',
            type: 'string',
            required: false,
            label: 'Stderr Log Path',
            placeholder: 'logs/error.log',
            description: 'Standard error log file path',
            group: 'logging'
        },
        {
            name: 'combineLogs',
            type: 'boolean',
            required: false,
            label: 'Combine Logs',
            description: 'Combine stdout and stderr',
            defaultValue: false,
            group: 'logging'
        },
        {
            name: 'mergeLogs',
            type: 'boolean',
            required: false,
            label: 'Merge Logs',
            description: 'Merge logs from all instances',
            defaultValue: false,
            group: 'logging'
        },
        {
            name: 'logDateFormat',
            type: 'string',
            required: false,
            label: 'Log Date Format',
            placeholder: 'YYYY-MM-DD HH:mm:ss',
            description: 'Log timestamp format',
            group: 'logging'
        },
        
        // Resources
        {
            name: 'maxMemory',
            type: 'number',
            required: false,
            label: 'Max Memory (bytes)',
            placeholder: '0',
            description: 'Max memory in bytes before auto-restart (0 = disabled)',
            defaultValue: 0,
            group: 'resources'
        },
        {
            name: 'nice',
            type: 'number',
            required: false,
            label: 'Nice Value',
            placeholder: '0',
            description: 'Process priority (-20 to 19, lower = higher priority)',
            group: 'resources'
        },
        
        // Advanced
        {
            name: 'cron',
            type: 'string',
            required: false,
            label: 'Cron Expression',
            placeholder: '0 * * * *',
            description: 'Execute as cron job',
            group: 'advanced'
        },
        {
            name: 'dotEnv',
            type: 'string',
            required: false,
            label: 'Dotenv File',
            placeholder: '.env',
            description: 'Dotenv file path',
            group: 'advanced'
        },
        {
            name: 'lbStrategy',
            type: 'string',
            required: false,
            label: 'Load Balancing Strategy',
            description: 'Strategy for clustering',
            options: [
                { value: '', label: 'Default (Round Robin)' },
                { value: 'round-robin', label: 'Round Robin' },
                { value: 'least-connections', label: 'Least Connections' },
                { value: 'weighted-round-robin', label: 'Weighted Round Robin' }
            ],
            group: 'advanced'
        }
    ];
}


/**
 * Deployment environment configuration type
 */
export type DeploymentEnvConfig = typeof DeploymentEnvConfigSchema.infer;

/**
 * Deployment configuration type
 */
export interface DeploymentConfig {
  /** Git repository URL */
  repo?: string;
  /** Deployment environments (staging, production, etc.) */
  environments?: Record<string, DeploymentEnvConfig>;
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
  const logDir = config.logDir || DEFAULT_PROCESS_CONFIG.logDir;

  return {
    ...config,
    processes: config.processes.map((proc: ProcessConfig) => {
      const p = applyDefaults(proc, defaults);
      if (!p.stdout) {
        p.stdout = getDefaultLogPath(p.name, logDir);
      }
      if (!p.stderr) {
        p.stderr = getDefaultErrLogPath(p.name, logDir);
      }
      return p;
    }),
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
