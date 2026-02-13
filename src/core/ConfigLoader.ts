/**
 * Configuration loader for TSPM
 * Supports YAML, JSON, and JSONC config files
 * Uses the unified config manager for consistent behavior
 */

import { ConfigManager, ConfigNotFoundError, ConfigParseError, ConfigValidationError } from '../utils/config/manager';
import type { TSPMConfig } from '../utils/config/schema';

export class ConfigLoader {
  private static manager: ConfigManager | null = null;

  /**
   * Get or create the config manager instance
   */
  private static getManager(): ConfigManager {
    if (!this.manager) {
      this.manager = new ConfigManager();
    }
    return this.manager;
  }

  /**
   * Load and parse a configuration file
   * @param path Path to the config file (supports .yaml, .yml, .json, .jsonc)
   * @returns Parsed TSPMConfig object
   * @throws ConfigNotFoundError if file not found
   * @throws ConfigParseError if parsing fails
   * @throws ConfigValidationError if validation fails
   */
  static async load(path: string): Promise<TSPMConfig> {
    const manager = this.getManager();
    return manager.load(path);
  }

  /**
   * Load configuration with auto-discovery
   * Searches for default config files if path not specified
   * @param path Optional path to config file
   * @returns Parsed TSPMConfig object
   */
  static async loadWithDiscovery(path?: string): Promise<TSPMConfig> {
    const manager = this.getManager();
    return manager.load(path);
  }

  /**
   * Discover config file in current directory
   * @returns Path to found config file or null
   */
  static discoverConfigFile(): string | null {
    return this.getManager().discoverConfigFile();
  }

  /**
   * Initialize a new TSPM workspace
   * Creates directories and sample config
   */
  static async init(options?: { format?: 'yaml' | 'json', force?: boolean }) {
    return this.getManager().init(options);
  }

  /**
   * Validate a configuration object
   * @param config Configuration to validate
   * @returns Validation result
   */
  static validate(config: unknown) {
    return this.getManager().validateConfig(config);
  }
}

// Re-export error types for convenience
export { ConfigNotFoundError, ConfigParseError, ConfigValidationError };
