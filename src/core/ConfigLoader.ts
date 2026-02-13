/**
 * Configuration loader for TSPM
 * Supports YAML, JSON, and JSONC config files
 */

import { file } from "bun";
import type { TSPMConfig } from "./types";

export class ConfigLoader {
  /**
   * Load and parse a configuration file
   * @param path Path to the config file (supports .yaml, .yml, .json, .jsonc)
   * @returns Parsed TSPMConfig object
   */
  static async load(path: string): Promise<TSPMConfig> {
    const configFile = file(path);
    
    if (!(await configFile.exists())) {
      throw new Error(`Config file not found: ${path}`);
    }

    const content = await configFile.text();

    if (path.endsWith(".yaml") || path.endsWith(".yml")) {
      // @ts-ignore - Bun.YAML might not be in the current types yet but it exists in Bun
      return Bun.YAML.parse(content) as TSPMConfig;
    }

    if (path.endsWith(".jsonc")) {
      // @ts-ignore - Bun.JSONC might not be in the current types yet but it exists in Bun
      return Bun.JSONC.parse(content) as TSPMConfig;
    }

    return JSON.parse(content) as TSPMConfig;
  }
}
