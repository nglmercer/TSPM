/**
 * YAML Configuration Utility
 * Uses Bun's native YAML parser for better performance
 * @module utils/config/yaml
 */

import { readFileSync, writeFileSync } from 'fs';

/**
 * Options for YAML parsing
 */
export interface YamlParseOptions {
  /** Path to the YAML file */
  path: string;
  /** Whether to throw on parse errors (default: true) */
  strict?: boolean;
}

/**
 * Options for YAML stringification
 */
export interface YamlStringifyOptions {
  /** Indentation width (default: 2) */
  indent?: number;
}

/**
 * Result of YAML parsing operation
 */
export interface YamlParseResult<T> {
  /** Parsed data */
  data: T | null;
  /** Error message if parsing failed */
  error: string | null;
  /** Whether parsing was successful */
  success: boolean;
}

/**
 * Parse a YAML string into a JavaScript object
 * Uses Bun's native YAML parser for optimal performance
 * 
 * @param content - YAML string to parse
 * @returns Parsed object or throws on error
 * @example
 * ```ts
 * const config = parseYamlString(`
 *   server:
 *     port: 3000
 *     host: localhost
 * `);
 * ```
 */
export function parseYamlString<T = unknown>(content: string): T {
  return Bun.YAML.parse(content) as T;
}

/**
 * Parse a YAML string with error handling
 * Returns a result object instead of throwing
 * 
 * @param content - YAML string to parse
 * @returns Parse result with data and error status
 */
export function parseYamlStringSafe<T = unknown>(content: string): YamlParseResult<T> {
  try {
    const data = Bun.YAML.parse(content) as T;
    return { data, error: null, success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { data: null, error, success: false };
  }
}

/**
 * Read and parse a YAML file
 * Uses Bun's fast file reading capabilities
 * 
 * @param path - Path to the YAML file
 * @returns Parsed object
 * @throws If file cannot be read or parsed
 * @example
 * ```ts
 * const config = readYamlFile<Config>('./config/app.yaml');
 * ```
 */
export async function readYamlFile<T = unknown>(path: string): Promise<T> {
  const file = Bun.file(path);
  const content = await file.text();
  return Bun.YAML.parse(content) as T;
}

/**
 * Read and parse a YAML file with error handling
 * 
 * @param options - Parse options including path and strict mode
 * @returns Parse result with data and error status
 */
export async function readYamlFileSafe<T = unknown>(
  options: YamlParseOptions
): Promise<YamlParseResult<T>> {
  try {
    const file = Bun.file(options.path);
    
    if (!(await file.exists())) {
      return {
        data: null,
        error: `File not found: ${options.path}`,
        success: false,
      };
    }
    
    const content = await file.text();
    return parseYamlStringSafe<T>(content);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { data: null, error, success: false };
  }
}

/**
 * Read a YAML file synchronously
 * 
 * @param path - Path to the YAML file
 * @returns Parsed object
 * @throws If file cannot be read or parsed
 */
export function readYamlFileSync<T = unknown>(path: string): T {
  const content = readFileSync(path, 'utf-8');
  return Bun.YAML.parse(content) as T;
}

/**
 * Stringify a JavaScript object to YAML
 * Uses Bun's native YAML stringifier
 * 
 * @param data - Object to stringify
 * @param options - Stringification options
 * @returns YAML string
 * @example
 * ```ts
 * const yaml = stringifyYaml({ server: { port: 3000 } });
 * ```
 */
export function stringifyYaml(data: unknown, _options?: YamlStringifyOptions): string {
  // Bun.YAML.stringify returns the YAML string representation
  return Bun.YAML.stringify(data);
}

/**
 * Write data to a YAML file
 * 
 * @param path - Path to write the file
 * @param data - Data to write
 * @param options - Stringification options
 * @throws If file cannot be written
 */
export async function writeYamlFile(
  path: string,
  data: unknown,
  options?: YamlStringifyOptions
): Promise<void> {
  const content = stringifyYaml(data, options);
  await Bun.write(path, content);
}

/**
 * Write data to a YAML file synchronously
 * 
 * @param path - Path to write the file
 * @param data - Data to write
 * @param options - Stringification options
 */
export function writeYamlFileSync(
  path: string,
  data: unknown,
  options?: YamlStringifyOptions
): void {
  const content = stringifyYaml(data, options);
  writeFileSync(path, content);
}

/**
 * Check if a file is a valid YAML file
 * 
 * @param path - Path to check
 * @returns True if file exists and is valid YAML
 */
export async function isValidYamlFile(path: string): Promise<boolean> {
  const result = await readYamlFileSafe({ path });
  return result.success;
}

/**
 * Deep merge multiple YAML configurations
 * Later configs override earlier ones
 * 
 * @param configs - Array of config objects to merge
 * @returns Merged configuration
 */
export function mergeYamlConfigs<T extends Record<string, unknown>>(...configs: Partial<T>[]): T {
  const result: Record<string, unknown> = {};
  
  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        result[key] !== null &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
        result[key] = mergeYamlConfigs(
          result[key] as Record<string, unknown>,
          value as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    }
  }
  
  return result as T;
}
