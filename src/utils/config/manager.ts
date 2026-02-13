/**
 * Configuration Manager
 * Handles config discovery, loading, initialization, and management
 * @module utils/config/manager
 */

import { existsSync, mkdirSync } from "fs";
import { join, dirname, resolve } from "path";
import {
  readConfigFile,
  writeConfigFile,
  readConfigFileSafe,
  detectConfigFormat,
} from "./index";
import { readYamlFileSync } from "./yaml";
import { readJsonFileSync } from "./json";
import {
  validateConfig,
  normalizeConfig,
  type TSPMConfig,
  type ProcessConfig,
  type ValidationResult,
} from "./schema";
import {
  DEFAULT_CONFIG_FILES,
  DEFAULT_PROCESS_CONFIG,
  ENV_VARS,
} from "./constants";

/**
 * Configuration manager options
 */
export interface ConfigManagerOptions {
  /** Custom config file path */
  configPath?: string;
  /** Working directory */
  cwd?: string;
  /** Whether to validate config on load */
  validate?: boolean;
  /** Whether to normalize config on load */
  normalize?: boolean;
}

/**
 * Configuration manager for TSPM
 * Provides a unified interface for config operations
 */
export class ConfigManager {
  private configPath: string | null = null;
  private config: TSPMConfig | null = null;
  private cwd: string;
  private validate: boolean;
  private normalize: boolean;

  constructor(options: ConfigManagerOptions = {}) {
    this.cwd = options.cwd ?? process.cwd();
    this.validate = options.validate ?? true;
    this.normalize = options.normalize ?? true;

    if (options.configPath) {
      this.configPath = resolve(this.cwd, options.configPath);
    }
  }

  /**
   * Discover configuration file in the working directory
   * Searches for default config file names
   *
   * @returns Path to found config file or null
   */
  discoverConfigFile(): string | null {
    // Check environment variable first
    const envPath = process.env[ENV_VARS.CONFIG_PATH];
    if (envPath) {
      const fullPath = resolve(this.cwd, envPath);
      if (existsSync(fullPath)) {
        return fullPath;
      }
    }

    // Check for explicitly set path
    if (this.configPath && existsSync(this.configPath)) {
      return this.configPath;
    }

    // Search for default config files
    for (const filename of DEFAULT_CONFIG_FILES) {
      const filepath = join(this.cwd, filename);
      if (existsSync(filepath)) {
        return filepath;
      }
    }

    return null;
  }

  /**
   * Load configuration from file
   *
   * @param path - Optional path to config file
   * @returns Loaded configuration
   * @throws If config file not found or invalid
   */
  async load(path?: string): Promise<TSPMConfig> {
    const configPath = path ? resolve(this.cwd, path) : this.discoverConfigFile();

    if (!configPath) {
      throw new ConfigNotFoundError("No configuration file found");
    }

    this.configPath = configPath;

    // Read config file
    const result = await readConfigFileSafe<TSPMConfig>(configPath);

    if (!result.success || !result.data) {
      throw new ConfigParseError(`Failed to parse config file: ${result.error}`);
    }

    let config = result.data;

    // Validate config
    if (this.validate) {
      const validation = validateConfig(config);
      if (!validation.valid) {
        throw new ConfigValidationError(
          "Configuration validation failed",
          validation
        );
      }

      // Log warnings
      if (validation.warnings.length > 0) {
        for (const warning of validation.warnings) {
          console.warn(`[TSPM] Warning: ${warning.field} - ${warning.message}`);
        }
      }
    }

    // Normalize config
    if (this.normalize) {
      config = normalizeConfig(config);
    }

    this.config = config;
    return config;
  }

  /**
   * Initialize a new TSPM workspace
   * Creates directories and sample config
   *
   * @param options Initialization options
   */
  async init(options: { format?: "yaml" | "json"; force?: boolean } = {}) {
    const { format = "yaml", force = false } = options;

    // 1. Create directories
    const logDir = resolve(this.cwd, DEFAULT_PROCESS_CONFIG.logDir);
    const pidDir = resolve(this.cwd, DEFAULT_PROCESS_CONFIG.pidDir);

    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
      console.log(`[TSPM] Created log directory: ${logDir}`);
    }

    if (!existsSync(pidDir)) {
      mkdirSync(pidDir, { recursive: true });
      console.log(`[TSPM] Created pid directory: ${pidDir}`);
    }

    // 2. Create sample config if none exists
    const existingConfig = this.discoverConfigFile();
    if (!existingConfig || force) {
      const configPath = await this.createSampleConfig(format);
      console.log(`[TSPM] Created sample configuration: ${configPath}`);
    } else {
      console.log(`[TSPM] Config already exists: ${existingConfig}`);
    }

    return true;
  }

  /**
   * Load configuration synchronously
   *
   * @param path - Optional path to config file
   * @returns Loaded configuration
   */
  loadSync(path?: string): TSPMConfig {
    const configPath = path ? resolve(this.cwd, path) : this.discoverConfigFile();

    if (!configPath) {
      throw new ConfigNotFoundError("No configuration file found");
    }

    this.configPath = configPath;

    // Use imported functions for sync reading
    const format = detectConfigFormat(configPath);

    let config: TSPMConfig;
    if (format === "yaml" || format === "yml") {
      config = readYamlFileSync(configPath) as TSPMConfig;
    } else {
      config = readJsonFileSync(configPath) as TSPMConfig;
    }

    // Validate config
    if (this.validate) {
      const validation = validateConfig(config);
      if (!validation.valid) {
        throw new ConfigValidationError(
          "Configuration validation failed",
          validation
        );
      }
    }

    // Normalize config
    if (this.normalize) {
      config = normalizeConfig(config);
    }

    this.config = config;
    return config;
  }

  /**
   * Get currently loaded config
   *
   * @returns Current config or throws if not loaded
   */
  getConfig(): TSPMConfig {
    if (!this.config) {
      throw new Error("Configuration not loaded. Call load() first.");
    }
    return this.config;
  }

  /**
   * Get config file path
   *
   * @returns Current config file path or null
   */
  getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Save configuration to file
   *
   * @param config - Configuration to save
   * @param path - Optional path to save to
   */
  async save(config: TSPMConfig, path?: string): Promise<void> {
    const savePath = path ? resolve(this.cwd, path) : this.configPath;

    if (!savePath) {
      throw new Error("No config path specified");
    }

    // Ensure directory exists
    const dir = dirname(savePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    await writeConfigFile(savePath, config);
    this.config = config;
  }

  /**
   * Validate a configuration
   *
   * @param config - Configuration to validate
   * @returns Validation result
   */
  validateConfig(config: unknown): ValidationResult {
    return validateConfig(config);
  }

  /**
   * Get a process by name
   *
   * @param name - Process name
   * @returns Process config or undefined
   */
  getProcess(name: string): ProcessConfig | undefined {
    return this.config?.processes.find((p) => p.name === name);
  }

  /**
   * Add a process to the configuration
   *
   * @param process - Process configuration to add
   */
  addProcess(process: ProcessConfig): void {
    if (!this.config) {
      this.config = { processes: [] };
    }
    this.config.processes.push(process);
  }

  /**
   * Remove a process from the configuration
   *
   * @param name - Name of process to remove
   * @returns True if process was removed
   */
  removeProcess(name: string): boolean {
    if (!this.config) return false;

    const index = this.config.processes.findIndex((p) => p.name === name);
    if (index === -1) return false;

    this.config.processes.splice(index, 1);
    return true;
  }

  /**
   * Update a process configuration
   *
   * @param name - Name of process to update
   * @param updates - Partial process config to merge
   * @returns Updated process or undefined
   */
  updateProcess(
    name: string,
    updates: Partial<ProcessConfig>
  ): ProcessConfig | undefined {
    const process = this.getProcess(name);
    if (!process) return undefined;

    Object.assign(process, updates);
    return process;
  }

  /**
   * Create a sample configuration file
   *
   * @param format - Format to use (yaml or json)
   * @param path - Path to create the file
   */
  async createSampleConfig(
    format: "yaml" | "json" = "yaml",
    path?: string
  ): Promise<string> {
    const sampleConfig: TSPMConfig = {
      processes: [
        {
          name: "example-app",
          script: "bun",
          args: ["run", "src/index.ts"],
          env: {
            NODE_ENV: "production",
            PORT: "3000",
          },
          autorestart: true,
          stdout: "logs/example-app.log",
        },
      ],
      defaults: {
        autorestart: true,
        maxRestarts: DEFAULT_PROCESS_CONFIG.maxRestarts,
      },
      logDir: DEFAULT_PROCESS_CONFIG.logDir,
    };

    const filename = path ?? `tspm.${format === "yaml" ? "yaml" : "jsonc"}`;
    const fullPath = resolve(this.cwd, filename);

    await this.save(sampleConfig, fullPath);
    return fullPath;
  }

  /**
   * Check if a config file exists
   *
   * @returns True if config file exists
   */
  exists(): boolean {
    return this.discoverConfigFile() !== null;
  }

  /**
   * Reload configuration from disk
   *
   * @returns Reloaded configuration
   */
  async reload(): Promise<TSPMConfig> {
    this.config = null;
    return this.load();
  }
}

/**
 * Error thrown when config file is not found
 */
export class ConfigNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigNotFoundError";
  }
}

/**
 * Error thrown when config parsing fails
 */
export class ConfigParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigParseError";
  }
}

/**
 * Error thrown when config validation fails
 */
export class ConfigValidationError extends Error {
  public readonly validation: ValidationResult;

  constructor(message: string, validation: ValidationResult) {
    super(message);
    this.name = "ConfigValidationError";
    this.validation = validation;
  }
}

// Singleton instance for convenience
let defaultManager: ConfigManager | null = null;

/**
 * Get the default config manager instance
 *
 * @param options - Manager options (only used on first call)
 * @returns Config manager instance
 */
export function getConfigManager(
  options?: ConfigManagerOptions
): ConfigManager {
  if (!defaultManager) {
    defaultManager = new ConfigManager(options);
  }
  return defaultManager;
}

/**
 * Quick load configuration
 *
 * @param path - Optional path to config file
 * @returns Loaded configuration
 */
export async function loadConfig(path?: string): Promise<TSPMConfig> {
  const manager = getConfigManager();
  return manager.load(path);
}

/**
 * Quick validate configuration
 *
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateConfigFile(config: unknown): ValidationResult {
  return validateConfig(config);
}
