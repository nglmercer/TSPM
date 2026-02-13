/**
 * Log Management Utility
 * Handles log rotation and structured logging
 * @module utils/logger
 */

import { existsSync, renameSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { LOG_CONFIG } from "./config/constants";

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
    maxSize = LOG_CONFIG.maxFileSize, 
    maxFiles = LOG_CONFIG.maxFiles
  ): void {
    if (!existsSync(logPath)) return;

    try {
      const stats = statSync(logPath);
      if (stats.size < maxSize) return;

      // Rotate: log -> log.1 -> log.2 ...
      for (let i = maxFiles - 1; i >= 1; i--) {
        const oldFile = `${logPath}.${i}`;
        const newFile = `${logPath}.${i + 1}`;
        if (existsSync(oldFile)) {
          if (i + 1 > maxFiles) {
            unlinkSync(oldFile);
          } else {
            renameSync(oldFile, newFile);
          }
        }
      }

      // Rename current to .1
      renameSync(logPath, `${logPath}.1`);
    } catch (e) {
      console.error(`[TSPM] Log rotation error for ${logPath}: ${e}`);
    }
  }

  /**
   * Format a log message with timestamp
   * 
   * @param message - Message to format
   * @returns Formatted message
   */
  static formatMessage(message: string): string {
    const now = new Date();
    // Simple ISO-ish format for now, or match LOG_CONFIG.dateFormat if we had a library
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    return `[${timestamp}] ${message}`;
  }
}
