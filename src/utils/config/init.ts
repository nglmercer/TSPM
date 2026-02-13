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
} from './constants';

/**
 * Options for initializing a config file
 */
export interface InitConfigOptions {
  /** Directory to create the config in */
  directory?: string;
  /** Format to use (yaml or json) */
  format?: 'yaml' | 'yml' | 'json' | 'jsonc';
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
export const SAMPLE_PROCESSES: Record<string, Partial<ProcessConfig>> = {
  web: {
    script: 'bun',
    args: ['run', 'src/index.ts'],
    env: { NODE_ENV: 'production', PORT: '3000' },
    autorestart: true,
    stdout: 'logs/app.log',
  },
  api: {
    script: 'bun',
    args: ['run', 'src/server.ts'],
    env: { NODE_ENV: 'production', PORT: '4000' },
    autorestart: true,
    stdout: 'logs/api.log',
  },
  worker: {
    script: 'bun',
    args: ['run', 'src/worker.ts'],
    autorestart: true,
    stdout: 'logs/worker.log',
  },
  cron: {
    script: 'bun',
    args: ['run', 'src/cron.ts'],
    cron: '0 * * * *',
    autorestart: false,
    stdout: 'logs/cron.log',
  },
};

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
        script: 'bun',
        args: ['run', scriptPath],
        env: {
          NODE_ENV: 'development',
          PORT: String(port),
        },
        autorestart: true,
        stdout: `logs/${processName}.log`,
      },
    ],
    defaults: {
      autorestart: true,
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
        script: 'bun',
        args: ['run', 'src/server.ts'],
        env: { PORT: '3000', NODE_ENV: 'production' },
        autorestart: true,
        stdout: 'logs/web-server.log',
      },
      {
        name: 'api-server',
        script: 'bun',
        args: ['run', 'src/api.ts'],
        env: { PORT: '4000', NODE_ENV: 'production' },
        autorestart: true,
        stdout: 'logs/api-server.log',
      },
      {
        name: 'worker',
        script: 'bun',
        args: ['run', 'src/worker.ts'],
        autorestart: true,
        stdout: 'logs/worker.log',
      },
    ],
    defaults: {
      autorestart: true,
      maxRestarts: DEFAULT_PROCESS_CONFIG.maxRestarts,
    },
    logDir: 'logs',
  };
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
    format = 'yaml',
    force = false,
    ...sampleOptions
  } = options;

  // Determine config filename
  const filename = format === 'json' ? 'tspm.jsonc' : `tspm.${format}`;
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
export function getDefaultFilename(format: 'yaml' | 'json' = 'yaml'): string {
  return format === 'json' ? 'tspm.jsonc' : 'tspm.yaml';
}

/**
 * Generate a process configuration from a template
 * 
 * @param template - Template name (web, api, worker, cron)
 * @param overrides - Values to override in template
 * @returns Process configuration
 */
export function fromTemplate(
  template: keyof typeof SAMPLE_PROCESSES,
  overrides: Partial<ProcessConfig> = {}
): ProcessConfig {
  const base = SAMPLE_PROCESSES[template];
  
  if (!base) {
    throw new Error(`Unknown template: ${template}. Available: ${Object.keys(SAMPLE_PROCESSES).join(', ')}`);
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
        autorestart: true,
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
      script: 'bun',
      args: ['run', scriptPath ?? `src/${name}.ts`],
      env: { PORT: String(port), NODE_ENV: 'production' },
      autorestart: true,
      stdout: `logs/${name}.log`,
    });
  }

  /**
   * Add a worker process
   */
  addWorker(name: string, scriptPath?: string): this {
    return this.addProcess({
      name,
      script: 'bun',
      args: ['run', scriptPath ?? `src/${name}.ts`],
      autorestart: true,
      stdout: `logs/${name}.log`,
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
