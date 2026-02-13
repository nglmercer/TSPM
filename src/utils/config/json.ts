/**
 * JSON/JSONC Configuration Utility
 * Uses Bun's native JSONC parser for better performance
 * Supports JSON with Comments (JSONC) format
 * @module utils/config/json
 */

import { readFileSync, writeFileSync } from 'fs';

/**
 * Options for JSON/JSONC parsing
 */
export interface JsonParseOptions {
  /** Path to the JSON/JSONC file */
  path: string;
  /** Whether to throw on parse errors (default: true) */
  strict?: boolean;
}

/**
 * Options for JSON stringification
 */
export interface JsonStringifyOptions {
  /** Indentation width (default: 2) */
  indent?: number;
}

/**
 * Result of JSON/JSONC parsing operation
 */
export interface JsonParseResult<T> {
  /** Parsed data */
  data: T | null;
  /** Error message if parsing failed */
  error: string | null;
  /** Whether parsing was successful */
  success: boolean;
}

/**
 * Parse a JSON/JSONC string into a JavaScript object
 * Uses Bun's native JSONC parser for optimal performance
 * Supports JSON with Comments and trailing commas
 * 
 * @param content - JSON/JSONC string to parse
 * @returns Parsed object
 * @throws If parsing fails
 * @example
 * ```ts
 * const config = parseJsonString(`
 * {
 *   // Server configuration
 *   "server": {
 *     "port": 3000,
 *     "host": "localhost",
 *   }
 * }
 * `);
 * ```
 */
export function parseJsonString<T = unknown>(content: string): T {
  return Bun.JSONC.parse(content) as T;
}

/**
 * Parse a JSON/JSONC string with error handling
 * Returns a result object instead of throwing
 * 
 * @param content - JSON/JSONC string to parse
 * @returns Parse result with data and error status
 */
export function parseJsonStringSafe<T = unknown>(content: string): JsonParseResult<T> {
  try {
    const data = Bun.JSONC.parse(content) as T;
    return { data, error: null, success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { data: null, error, success: false };
  }
}

/**
 * Read and parse a JSON/JSONC file
 * Uses Bun's fast file reading capabilities
 * 
 * @param path - Path to the JSON/JSONC file
 * @returns Parsed object
 * @throws If file cannot be read or parsed
 * @example
 * ```ts
 * const config = readJsonFile<Config>('./config/app.json');
 * ```
 */
export async function readJsonFile<T = unknown>(path: string): Promise<T> {
  const file = Bun.file(path);
  const content = await file.text();
  return Bun.JSONC.parse(content) as T;
}

/**
 * Read and parse a JSON/JSONC file with error handling
 * 
 * @param options - Parse options including path and strict mode
 * @returns Parse result with data and error status
 */
export async function readJsonFileSafe<T = unknown>(
  options: JsonParseOptions
): Promise<JsonParseResult<T>> {
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
    return parseJsonStringSafe<T>(content);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { data: null, error, success: false };
  }
}

/**
 * Read a JSON/JSONC file synchronously
 * 
 * @param path - Path to the JSON/JSONC file
 * @returns Parsed object
 * @throws If file cannot be read or parsed
 */
export function readJsonFileSync<T = unknown>(path: string): T {
  const content = readFileSync(path, 'utf-8');
  return Bun.JSONC.parse(content) as T;
}

/**
 * Stringify a JavaScript object to JSON
 * 
 * @param data - Object to stringify
 * @param options - Stringification options
 * @returns JSON string
 * @example
 * ```ts
 * const json = stringifyJson({ server: { port: 3000 } });
 * ```
 */
export function stringifyJson(data: unknown, options?: JsonStringifyOptions): string {
  const indent = options?.indent ?? 2;
  return JSON.stringify(data, null, indent);
}

/**
 * Write data to a JSON file
 * 
 * @param path - Path to write the file
 * @param data - Data to write
 * @param options - Stringification options
 * @throws If file cannot be written
 */
export async function writeJsonFile(
  path: string,
  data: unknown,
  options?: JsonStringifyOptions
): Promise<void> {
  const content = stringifyJson(data, options);
  await Bun.write(path, content);
}

/**
 * Write data to a JSON file synchronously
 * 
 * @param path - Path to write the file
 * @param data - Data to write
 * @param options - Stringification options
 */
export function writeJsonFileSync(
  path: string,
  data: unknown,
  options?: JsonStringifyOptions
): void {
  const content = stringifyJson(data, options);
  writeFileSync(path, content);
}

/**
 * Check if a file is a valid JSON/JSONC file
 * 
 * @param path - Path to check
 * @returns True if file exists and is valid JSON/JSONC
 */
export async function isValidJsonFile(path: string): Promise<boolean> {
  const result = await readJsonFileSafe({ path });
  return result.success;
}

/**
 * Deep merge multiple JSON configurations
 * Later configs override earlier ones
 * 
 * @param configs - Array of config objects to merge
 * @returns Merged configuration
 */
export function mergeJsonConfigs<T extends Record<string, unknown>>(...configs: Partial<T>[]): T {
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
        result[key] = mergeJsonConfigs(
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

/**
 * Detect if a file is JSONC (has comments or trailing commas)
 * Useful for determining file format
 * 
 * @param content - File content to check
 * @returns True if content appears to be JSONC
 */
export function isJsoncContent(content: string): boolean {
  // Check for single-line comments
  if (/\/\/.*$/m.test(content)) return true;
  // Check for multi-line comments
  if (/\/\*[\s\S]*?\*\//.test(content)) return true;
  // Check for trailing commas
  if (/,\s*[}\]]/.test(content)) return true;
  return false;
}

/**
 * Strip comments from JSONC content to make it valid JSON
 * Note: Bun.JSONC.parse handles this automatically
 * 
 * @param content - JSONC content
 * @returns Valid JSON string
 */
export function stripJsoncComments(content: string): string {
  // Remove single-line comments
  let result = content.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove trailing commas before } or ]
  result = result.replace(/,(\s*[}\]])/g, '$1');
  return result;
}
