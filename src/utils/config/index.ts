/**
 * Configuration Utilities
 * Re-exports all config parsers using Bun's native implementations
 * @module utils/config
 */

import { 
  ConfigFormatValues, 
  type ConfigFormat 
} from './constants';

// Re-export ConfigFormat type for external use
export type { ConfigFormat } from './constants';

// YAML utilities
export {
  parseYamlString,
  parseYamlStringSafe,
  readYamlFile,
  readYamlFileSafe,
  readYamlFileSync,
  stringifyYaml,
  writeYamlFile,
  writeYamlFileSync,
  isValidYamlFile,
  mergeYamlConfigs,
  type YamlParseOptions,
  type YamlStringifyOptions,
  type YamlParseResult,
} from './yaml';

// JSON/JSONC utilities
export {
  parseJsonString,
  parseJsonStringSafe,
  readJsonFile,
  readJsonFileSafe,
  readJsonFileSync,
  stringifyJson,
  writeJsonFile,
  writeJsonFileSync,
  isValidJsonFile,
  mergeJsonConfigs,
  isJsoncContent,
  stripJsoncComments,
  type JsonParseOptions,
  type JsonStringifyOptions,
  type JsonParseResult,
} from './json';

// Schema and validation
export {
  validateConfig,
  validateProcessConfig,
  applyDefaults,
  normalizeConfig,
  type ProcessConfig,
  type TSPMConfig,
  type ValidationError,
  type ValidationResult,
} from './schema';

// Config manager
export {
  ConfigManager,
  ConfigNotFoundError,
  ConfigParseError,
  ConfigValidationError,
  getConfigManager,
  loadConfig,
  validateConfigFile,
  type ConfigManagerOptions,
} from './manager';

// Constants
export {
  DEFAULT_CONFIG_FILES,
  DEFAULT_PROCESS_CONFIG,
  RESTART_CONFIG,
  WATCH_CONFIG,
  LOG_CONFIG,
  PROCESS_STATE,
  EXIT_CODES,
  SIGNALS,
  ENV_VARS,
  CONFIG_FILE_EXTENSIONS,
  CONFIG_MIME_TYPES,
  ProcessStateValues,
  ConfigFormatValues,
  ErrorSeverityValues,
  getDefaultLogPath,
  getDefaultPidPath,
  calculateRestartDelay,
  type ProcessState,
  type ErrorSeverity,
  type ExitCode,
  type Signal,
  type EnvVar,
} from './constants';

// Init utilities
export {
  initConfig,
  findExistingConfig,
  getDefaultFilename,
  createSampleConfig,
  createMultiProcessConfig,
  fromTemplate,
  addProcessToConfig,
  ConfigBuilder,
  createConfigBuilder,
  SAMPLE_PROCESSES,
  TemplateTypes,
  type TemplateType,
  type InitConfigOptions,
  type InitResult,
} from './init';

/**
 * Configuration file extensions mapping
 */
export const CONFIG_EXTENSIONS: Record<ConfigFormat, readonly string[]> = {
  [ConfigFormatValues.YAML]: ['.yaml'],
  [ConfigFormatValues.YML]: ['.yml'],
  [ConfigFormatValues.JSON]: ['.json'],
  [ConfigFormatValues.JSONC]: ['.jsonc'],
} as const;

/**
 * Detect configuration format from file path
 * 
 * @param path - File path
 * @returns Detected format or null if unknown
 */
export function detectConfigFormat(path: string): ConfigFormat | null {
  const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
  
  for (const [format, extensions] of Object.entries(CONFIG_EXTENSIONS)) {
    if (extensions.includes(ext)) {
      return format as ConfigFormat;
    }
  }
  
  return null;
}

/**
 * Read a configuration file auto-detecting format
 * 
 * @param path - Path to configuration file
 * @returns Parsed configuration object
 * @throws If file cannot be read or parsed
 */
export async function readConfigFile<T = unknown>(path: string): Promise<T> {
  const format = detectConfigFormat(path);
  
  switch (format) {
    case ConfigFormatValues.YAML:
    case ConfigFormatValues.YML:
      const { readYamlFile } = await import('./yaml');
      return readYamlFile<T>(path);
    case ConfigFormatValues.JSON:
    case ConfigFormatValues.JSONC:
      const { readJsonFile } = await import('./json');
      return readJsonFile<T>(path);
    default:
      throw new Error(`Unsupported config format: ${path}`);
  }
}

/**
 * Read a configuration file with error handling
 * 
 * @param path - Path to configuration file
 * @returns Parse result with data and error status
 */
export async function readConfigFileSafe<T = unknown>(
  path: string
): Promise<{ data: T | null; error: string | null; success: boolean }> {
  try {
    const format = detectConfigFormat(path);
    
    switch (format) {
      case ConfigFormatValues.YAML:
      case ConfigFormatValues.YML:
        const { readYamlFileSafe } = await import('./yaml');
        return readYamlFileSafe<T>({ path });
      case ConfigFormatValues.JSON:
      case ConfigFormatValues.JSONC:
        const { readJsonFileSafe } = await import('./json');
        return readJsonFileSafe<T>({ path });
      default:
        return {
          data: null,
          error: `Unsupported config format: ${path}`,
          success: false,
        };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { data: null, error, success: false };
  }
}

/**
 * Write a configuration file auto-detecting format from path
 * 
 * @param path - Path to write the file
 * @param data - Data to write
 * @throws If file cannot be written
 */
export async function writeConfigFile(
  path: string,
  data: unknown
): Promise<void> {
  const format = detectConfigFormat(path);
  
  switch (format) {
    case ConfigFormatValues.YAML:
    case ConfigFormatValues.YML:
      const { writeYamlFile } = await import('./yaml');
      return writeYamlFile(path, data);
    case ConfigFormatValues.JSON:
    case ConfigFormatValues.JSONC:
      const { writeJsonFile } = await import('./json');
      return writeJsonFile(path, data);
    default:
      throw new Error(`Unsupported config format: ${path}`);
  }
}
