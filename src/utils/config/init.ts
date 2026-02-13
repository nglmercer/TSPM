/**
 * Configuration Initialization Utilities
 * Helpers for creating and initializing TSPM configuration files
 * @module utils/config/init
 */

import { existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { writeConfigFile } from './index';
import type { TSPMConfig, ProcessConfig } from './schema';
import {
  DEFAULT_PROCESS_CONFIG,
  DEFAULT_CONFIG_FILES,
  ConfigFormatValues,
  type ConfigFormat,
} from './constants';

/**
 * Template types for process configuration
 */
export const TemplateTypes = {
  WEB: 'web',
  API: 'api',
  WORKER: 'worker',
  CRON: 'cron',
} as const;

export type TemplateType = typeof TemplateTypes[keyof typeof TemplateTypes];

/**
 * Options for initializing a config file
 */
export interface InitConfigOptions {
  /** Directory to create the config in */
  directory?: string;
  /** Format to use (yaml or json) */
  format?: ConfigFormat;
  /** Force overwrite existing config */
  force?: boolean;
  /** Process name for sample config */
  processName?: string;
  /** Script path for sample config */
  scriptPath?: string;
  /** Port for sample config */
  port?: number;
}

/**
 * Result of config initialization
 */
export interface InitResult {
  /** Path to created config file */
  path: string;
  /** Whether an existing config was overwritten */
  overwritten: boolean;
  /** The created configuration */
  config: TSPMConfig;
}

/**
 * Sample process configurations for different use cases
 */
export const SAMPLE_PROCESSES: Record<TemplateType, Partial<ProcessConfig>> = {
  [TemplateTypes.WEB]: {
    script: 'bun',
    args: ['run', 'src/index.ts'],
    env: { NODE_ENV: 'production', PORT: '3000' },
    autorestart: true,
    stdout: 'logs/app.log',
  },
  [TemplateTypes.API]: {
    script: 'bun',
    args: ['run', 'src/server.ts'],
    env: { NODE_ENV: 'production', PORT: '4000' },
    autorestart: true,
    stdout: 'logs/api.log',
  },
  [TemplateTypes.WORKER]: {
    script: 'bun',
    args: ['run', 'src/worker.ts'],
    autorestart: true,
    stdout: 'logs/worker.log',
  },
  [TemplateTypes.CRON]: {
    script: 'bun',
    args: ['run', 'src/cron.ts'],
    cron: '0 * * * *',
    autorestart: false,
    stdout: 'logs/cron.log',
  },
};

/**
 * Default script runner
 */
const DEFAULT_RUNNER = 'bun';
const DEFAULT_RUN_ARG = 'run';

/**
 * Create a sample TSPM configuration
 * 
 * @param options - Configuration options
 * @returns Sample configuration object
 */
export function createSampleConfig(options: InitConfigOptions = {}): TSPMConfig {
  const {
    processName = 'app',
    scriptPath = 'src/index.ts',
    port = 3000,
  } = options;

  const config: TSPMConfig = {
    processes: [
      {
        name: processName,
        script: DEFAULT_RUNNER,
        args: [DEFAULT_RUN_ARG, scriptPath],
        env: {
          NODE_ENV: 'development',
          PORT: String(port),
        },
        autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
        stdout: `${DEFAULT_PROCESS_CONFIG.logDir}/${processName}.log`,
      },
    ],
    defaults: {
      autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
      maxRestarts: DEFAULT_PROCESS_CONFIG.maxRestarts,
    },
    logDir: DEFAULT_PROCESS_CONFIG.logDir,
  };

  return config;
}

/**
 * Create a multi-process sample configuration
 * 
 * @returns Sample configuration with multiple processes
 */
export function createMultiProcessConfig(): TSPMConfig {
  return {
    processes: [
      {
        name: 'web-server',
        script: DEFAULT_RUNNER,
        args: [DEFAULT_RUN_ARG, 'src/server.ts'],
        env: { PORT: '3000', NODE_ENV: 'production' },
        autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
        stdout: `${DEFAULT_PROCESS_CONFIG.logDir}/web-server.log`,
      },
      {
        name: 'api-server',
        script: DEFAULT_RUNNER,
        args: [DEFAULT_RUN_ARG, 'src/api.ts'],
        env: { PORT: '4000', NODE_ENV: 'production' },
        autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
        stdout: `${DEFAULT_PROCESS_CONFIG.logDir}/api-server.log`,
      },
      {
        name: 'worker',
        script: DEFAULT_RUNNER,
        args: [DEFAULT_RUN_ARG, 'src/worker.ts'],
        autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
        stdout: `${DEFAULT_PROCESS_CONFIG.logDir}/worker.log`,
      },
    ],
    defaults: {
      autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
      maxRestarts: DEFAULT_PROCESS_CONFIG.maxRestarts,
    },
    logDir: DEFAULT_PROCESS_CONFIG.logDir,
  };
}

/**
 * Config file extension mapping
 */
const CONFIG_FILE_EXTENSIONS: Record<ConfigFormat, string> = {
  [ConfigFormatValues.YAML]: '.yaml',
  [ConfigFormatValues.YML]: '.yml',
  [ConfigFormatValues.JSON]: '.json',
  [ConfigFormatValues.JSONC]: '.jsonc',
} as const;

/**
 * Get config file extension for format
 */
function getConfigExtension(format: ConfigFormat): string {
  return CONFIG_FILE_EXTENSIONS[format] ?? CONFIG_FILE_EXTENSIONS[ConfigFormatValues.YAML];
}

/**
 * Initialize a new TSPM configuration file
 * 
 * @param options - Initialization options
 * @returns Result containing path and config
 * @throws If file exists and force is false
 */
export async function initConfig(options: InitConfigOptions = {}): Promise<InitResult> {
  const {
    directory = process.cwd(),
    format = ConfigFormatValues.YAML,
    force = false,
    ...sampleOptions
  } = options;

  // Determine config filename using constants
  const extension = getConfigExtension(format);
  const filename = `tspm${extension}`;
  const configPath = resolve(directory, filename);

  // Check if file exists
  if (existsSync(configPath) && !force) {
    throw new Error(
      `Config file already exists: ${configPath}. Use force: true to overwrite.`
    );
  }

  // Ensure directory exists
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  // Create sample config
  const config = createSampleConfig(sampleOptions);

  // Write config file
  await writeConfigFile(configPath, config);

  return {
    path: configPath,
    overwritten: force && existsSync(configPath),
    config,
  };
}

/**
 * Check if a TSPM config file exists in the directory
 * 
 * @param directory - Directory to check
 * @returns Path to existing config or null
 */
export function findExistingConfig(directory: string = process.cwd()): string | null {
  for (const filename of DEFAULT_CONFIG_FILES) {
    const filepath = join(directory, filename);
    if (existsSync(filepath)) {
      return filepath;
    }
  }
  return null;
}

/**
 * Get the default config filename for a format
 * 
 * @param format - Desired format
 * @returns Default filename
 */
export function getDefaultFilename(format: ConfigFormat = ConfigFormatValues.YAML): string {
  const extension = getConfigExtension(format);
  return `tspm${extension}`;
}

/**
 * Generate a process configuration from a template
 * 
 * @param template - Template name (web, api, worker, cron)
 * @param overrides - Values to override in template
 * @returns Process configuration
 */
export function fromTemplate(
  template: TemplateType,
  overrides: Partial<ProcessConfig> = {}
): ProcessConfig {
  const base = SAMPLE_PROCESSES[template];
  
  if (!base) {
    const availableTemplates = Object.values(TemplateTypes).join(', ');
    throw new Error(`Unknown template: ${template}. Available: ${availableTemplates}`);
  }

  return {
    ...base,
    ...overrides,
    env: {
      ...base.env,
      ...overrides.env,
    },
  } as ProcessConfig;
}

/**
 * Add a process to an existing configuration
 * 
 * @param config - Existing configuration
 * @param process - Process to add
 * @returns Updated configuration
 */
export function addProcessToConfig(
  config: TSPMConfig,
  process: ProcessConfig
): TSPMConfig {
  // Check for duplicate name
  const existing = config.processes.find(p => p.name === process.name);
  if (existing) {
    throw new Error(`Process with name "${process.name}" already exists`);
  }

  return {
    ...config,
    processes: [...config.processes, process],
  };
}

/**
 * Interactive config builder
 * Provides a fluent interface for building configurations
 */
export class ConfigBuilder {
  private config: TSPMConfig;

  constructor() {
    this.config = {
      processes: [],
      defaults: {
        autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
        maxRestarts: DEFAULT_PROCESS_CONFIG.maxRestarts,
      },
    };
  }

  /**
   * Add a process to the configuration
   */
  addProcess(process: ProcessConfig): this {
    this.config.processes.push(process);
    return this;
  }

  /**
   * Add a web server process
   */
  addWebServer(name: string, port: number = 3000, scriptPath?: string): this {
    return this.addProcess({
      name,
      script: DEFAULT_RUNNER,
      args: [DEFAULT_RUN_ARG, scriptPath ?? `src/${name}.ts`],
      env: { PORT: String(port), NODE_ENV: 'production' },
      autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
      stdout: `${DEFAULT_PROCESS_CONFIG.logDir}/${name}.log`,
    });
  }

  /**
   * Add a worker process
   */
  addWorker(name: string, scriptPath?: string): this {
    return this.addProcess({
      name,
      script: DEFAULT_RUNNER,
      args: [DEFAULT_RUN_ARG, scriptPath ?? `src/${name}.ts`],
      autorestart: DEFAULT_PROCESS_CONFIG.autorestart,
      stdout: `${DEFAULT_PROCESS_CONFIG.logDir}/${name}.log`,
    });
  }

  /**
   * Set default values for all processes
   */
  setDefaults(defaults: Partial<ProcessConfig>): this {
    this.config.defaults = {
      ...this.config.defaults,
      ...defaults,
    };
    return this;
  }

  /**
   * Set log directory
   */
  setLogDir(logDir: string): this {
    this.config.logDir = logDir;
    return this;
  }

  /**
   * Build the final configuration
   */
  build(): TSPMConfig {
    if (this.config.processes.length === 0) {
      throw new Error('Configuration must have at least one process');
    }
    return { ...this.config };
  }

  /**
   * Build and save the configuration
   */
  async save(path: string): Promise<TSPMConfig> {
    const config = this.build();
    await writeConfigFile(path, config);
    return config;
  }
}

/**
 * Create a new config builder
 */
export function createConfigBuilder(): ConfigBuilder {
  return new ConfigBuilder();
}
