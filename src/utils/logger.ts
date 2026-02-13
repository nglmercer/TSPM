/**
 * Log Management Utility
 * Handles log rotation, structured logging, and multiple log levels
 * @module utils/logger
 */

import { existsSync, mkdirSync, appendFileSync, renameSync, statSync, unlinkSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { LOG_CONFIG, ENV_VARS } from "./config/constants";

/**
 * Log level values
 */
export const LogLevelValues = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  SUCCESS: 'success',
  SILENT: 'silent',
} as const;

export type LogLevel = typeof LogLevelValues[keyof typeof LogLevelValues];

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevelValues.DEBUG]: 0,
  [LogLevelValues.INFO]: 1,
  [LogLevelValues.WARN]: 2,
  [LogLevelValues.ERROR]: 3,
  [LogLevelValues.SUCCESS]: 3,
  [LogLevelValues.SILENT]: 4,
};

/**
 * Log level colors for console output
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevelValues.DEBUG]: '\x1b[36m', // Cyan
  [LogLevelValues.INFO]: '\x1b[32m',  // Green
  [LogLevelValues.WARN]: '\x1b[33m',  // Yellow
  [LogLevelValues.ERROR]: '\x1b[31m',   // Red
  [LogLevelValues.SUCCESS]: '\x1b[32m', // Green
  [LogLevelValues.SILENT]: '\x1b[0m',  // Reset
};

/**
 * ANSI color reset code
 */
const COLOR_RESET = '\x1b[0m';

/**
 * Log metadata interface
 */
export interface LogMetadata {
  /** Process name */
  process?: string;
  /** Process ID */
  pid?: number;
  /** Timestamp */
  timestamp?: string;
  /** Additional context */
  [key: string]: unknown;
}

/**
 * Log entry interface
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Timestamp ISO string */
  timestamp: string;
  /** Process name */
  process?: string;
  /** Process ID */
  pid?: number;
  /** Additional metadata */
  metadata?: LogMetadata;
}

/**
 * Logger options interface
 */
export interface LoggerOptions {
  /** Log level (default: INFO) */
  level?: LogLevel;
  /** Log file path */
  file?: string;
  /** Process name for prefix */
  process?: string;
  /** Enable console output */
  console?: boolean;
  /** Enable file output */
  fileOutput?: boolean;
  /** Use JSON format */
  json?: boolean;
  /** Use colors in console */
  colors?: boolean;
  /** Timestamp format */
  timestampFormat?: 'iso' | 'locale' | 'unix';
}

/**
 * Format timestamp based on format type
 */
function formatTimestamp(format: 'iso' | 'locale' | 'unix' = 'iso'): string {
  const now = new Date();
  switch (format) {
    case 'locale':
      return now.toLocaleString();
    case 'unix':
      return String(Math.floor(now.getTime() / 1000));
    case 'iso':
    default:
      return now.toISOString().replace('T', ' ').substring(0, 19);
  }
}

/**
 * Format a log entry as JSON
 */
function formatAsJson(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Format a log entry as text
 */
function formatAsText(entry: LogEntry, useColors: boolean = true): string {
  const levelColor = useColors ? LOG_LEVEL_COLORS[entry.level] : '';
  const resetColor = useColors ? COLOR_RESET : '';
  const levelUpper = entry.level.toUpperCase().padEnd(5);
  
  let prefix = '';
  if (entry.process) {
    prefix = `[${entry.process}] `;
  }
  
  return `${entry.timestamp} ${levelColor}${levelUpper}${resetColor} ${prefix}${entry.message}`;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private level: LogLevel;
  private file?: string;
  private process?: string;
  private console: boolean;
  private fileOutput: boolean;
  private json: boolean;
  private colors: boolean;
  private timestampFormat: 'iso' | 'locale' | 'unix';

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? this.getDefaultLogLevel();
    this.file = options.file;
    this.process = options.process;
    this.console = options.console ?? true;
    this.fileOutput = options.fileOutput ?? false;
    this.json = options.json ?? false;
    this.colors = options.colors ?? true;
    this.timestampFormat = options.timestampFormat ?? 'iso';
    
    // Ensure log directory exists if file output is enabled
    if (this.file && this.fileOutput) {
      const dir = dirname(this.file);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Get default log level from environment or fallback to INFO
   */
  private getDefaultLogLevel(): LogLevel {
    const envLevel = process.env[ENV_VARS.LOG_LEVEL];
    if (envLevel && Object.values(LogLevelValues).includes(envLevel as LogLevel)) {
      return envLevel as LogLevel;
    }
    return LogLevelValues.INFO;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
  }

  /**
   * Create a log entry
   */
  private createEntry(level: LogLevel, message: string, metadata?: LogMetadata): LogEntry {
    return {
      level,
      message,
      timestamp: formatTimestamp(this.timestampFormat),
      process: this.process,
      pid: process.pid,
      metadata,
    };
  }

  /**
   * Write log entry to outputs
   */
  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Console output
    if (this.console) {
      const output = this.json 
        ? formatAsJson(entry)
        : formatAsText(entry, this.colors);
      
      if (entry.level === LogLevelValues.ERROR) {
        console.error(output);
      } else if (entry.level === LogLevelValues.WARN) {
        console.warn(output);
      } else {
        console.log(output);
      }
    }

    // File output
    if (this.fileOutput && this.file) {
      const output = this.json 
        ? formatAsJson(entry) + '\n'
        : formatAsText(entry, false) + '\n';
      
      try {
        appendFileSync(this.file, output);
      } catch (e) {
        console.error(`[TSPM] Failed to write to log file: ${e}`);
      }
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    this.write(this.createEntry(LogLevelValues.DEBUG, message, metadata));
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: LogMetadata): void {
    this.write(this.createEntry(LogLevelValues.INFO, message, metadata));
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    this.write(this.createEntry(LogLevelValues.WARN, message, metadata));
  }

  /**
   * Log an error message
   */
  error(message: string, metadata?: LogMetadata): void {
    this.write(this.createEntry(LogLevelValues.ERROR, message, metadata));
  }

  /**
   * Log a success message
   */
  success(message: string, metadata?: LogMetadata): void {
    this.write(this.createEntry(LogLevelValues.SUCCESS, message, metadata));
  }

  /**
   * Log a raw message without formatting
   */
  raw(message: string): void {
    if (this.console) {
      console.log(message);
    }
    if (this.fileOutput && this.file) {
      try {
        appendFileSync(this.file, message + '\n');
      } catch (e) {
        console.error(`[TSPM] Failed to write to log file: ${e}`);
      }
    }
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Set JSON output mode
   */
  setJson(json: boolean): void {
    this.json = json;
  }

  /**
   * Set file output enabled
   */
  setFileOutput(fileOutput: boolean): void {
    this.fileOutput = fileOutput;
  }

  /**
   * Set log file path
   */
  setFile(file: string): void {
    this.file = file;
    if (file && this.fileOutput) {
      const dir = dirname(file);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Set console output enabled
   */
  setConsole(console: boolean): void {
    this.console = console;
  }

  /**
   * Set colors enabled
   */
  setColors(colors: boolean): void {
    this.colors = colors;
  }

  /**
   * Create a child logger with process context
   */
  child(process: string, options?: Partial<LoggerOptions>): Logger {
    return new Logger({
      level: options?.level ?? this.level,
      file: options?.file ?? this.file,
      process,
      console: options?.console ?? this.console,
      fileOutput: options?.fileOutput ?? this.fileOutput,
      json: options?.json ?? this.json,
      colors: options?.colors ?? this.colors,
      timestampFormat: options?.timestampFormat ?? this.timestampFormat,
    });
  }
}

/**
 * Log rotation manager
 */
export class LogManager {
  /**
   * Check and rotate logs if necessary
   * 
   * @param logPath - Path to the log file
   * @param maxSize - Maximum size in bytes before rotation
   * @param maxFiles - Maximum number of rotated files to keep
   */
  static rotate(
    logPath: string, 
    maxSize: number = LOG_CONFIG.maxFileSize, 
    maxFiles: number = LOG_CONFIG.maxFiles
  ): void {
    if (!existsSync(logPath)) return;

    try {
      const stats = statSync(logPath);
      if (stats.size < maxSize) return;

      // Delete oldest file if it exceeds maxFiles
      const oldestFile = `${logPath}.${maxFiles}`;
      if (existsSync(oldestFile)) {
        unlinkSync(oldestFile);
      }

      // Rotate: log.N -> log.N+1
      for (let i = maxFiles - 1; i >= 1; i--) {
        const oldFile = `${logPath}.${i}`;
        const newFile = `${logPath}.${i + 1}`;
        if (existsSync(oldFile)) {
          renameSync(oldFile, newFile);
        }
      }

      // Rename current to .1
      renameSync(logPath, `${logPath}.1`);
      
      // Create new empty log file
      writeFileSync(logPath, '');
    } catch (e) {
      log.error(`[TSPM] Log rotation error for ${logPath}: ${e}`);
    }
  }

  /**
   * Format a log message with timestamp
   * 
   * @param message - Message to format
   * @returns Formatted message
   */
  static formatMessage(message: string): string {
    return formatTimestamp('iso') + ' ' + message;
  }

  /**
   * Clean up old log files beyond retention
   * 
   * @param logDir - Log directory
   * @param maxFiles - Maximum files to keep
   */
  static cleanup(logDir: string, maxFiles: number = LOG_CONFIG.maxFiles): void {
    if (!existsSync(logDir)) return;
    
    try {
      const files = readdirSync(logDir);
      const logFiles = files
        .filter((f: string) => f.endsWith('.log') || f.match(/\.log\.\d+$/))
        .map((f: string) => ({
          name: f,
          path: join(logDir, f),
          time: statSync(join(logDir, f)).mtime.getTime(),
        }))
        .sort((a: { time: number }, b: { time: number }) => b.time - a.time);

      // Delete files beyond maxFiles
      for (let i = maxFiles; i < logFiles.length; i++) {
        if (logFiles[i]) {
          unlinkSync(logFiles[i]!.path);
        }
      }
    } catch (e) {
      log.error(`[TSPM] Log cleanup error: ${e}`);
    }
  }
}

// Default logger instance
let defaultLogger: Logger | null = null;

/**
 * Get the default logger instance
 */
export function getLogger(options?: LoggerOptions): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger(options);
  }
  return defaultLogger;
}

/**
 * Configure the default logger instance
 */
export function configureLogger(options: LoggerOptions): Logger {
  const logger = getLogger();
  if (options.level) logger.setLevel(options.level);
  if (options.json !== undefined) logger.setJson(options.json);
  if (options.fileOutput !== undefined) logger.setFileOutput(options.fileOutput);
  if (options.file !== undefined) logger.setFile(options.file);
  if (options.console !== undefined) logger.setConsole(options.console);
  if (options.colors !== undefined) logger.setColors(options.colors);
  
  if (options.file && options.fileOutput) {
    const dir = dirname(options.file!);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
  
  return logger;
}

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/**
 * Quick logging functions using default logger
 */
export const log = {
  debug: (message: string, metadata?: LogMetadata) => getLogger().debug(message, metadata),
  info: (message: string, metadata?: LogMetadata) => getLogger().info(message, metadata),
  warn: (message: string, metadata?: LogMetadata) => getLogger().warn(message, metadata),
  error: (message: string, metadata?: LogMetadata) => getLogger().error(message, metadata),
  success: (message: string, metadata?: LogMetadata) => getLogger().success(message, metadata),
  raw: (message: string) => getLogger().raw(message),
};
