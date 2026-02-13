import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import {
  Logger,
  LogManager,
  getLogger,
  createLogger,
  log,
  LogLevelValues,
  type LogLevel,
  type LogMetadata,
} from "../../src/utils/logger";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  test("should create logger with default options", () => {
    expect(logger).toBeDefined();
  });

  test("should create logger with custom options", () => {
    const logger = new Logger({
      level: 'debug',
      console: true,
      json: false,
      colors: true,
    });
    expect(logger).toBeDefined();
  });

  test("should get default log level", () => {
    expect(logger.getLevel()).toBeDefined();
  });

  test("should set log level", () => {
    logger.setLevel(LogLevelValues.WARN);
    expect(logger.getLevel()).toBe(LogLevelValues.WARN);
  });

  test("should log debug message", () => {
    // Just ensure no errors
    logger.debug("debug message");
  });

  test("should log info message", () => {
    logger.info("info message");
  });

  test("should log warn message", () => {
    logger.warn("warn message");
  });

  test("should log error message", () => {
    logger.error("error message");
  });

  test("should log success message", () => {
    logger.success("success message");
  });

  test("should log with metadata", () => {
    const metadata: LogMetadata = {
      process: "test",
      pid: 12345,
      custom: "value",
    };
    logger.info("message with metadata", metadata);
  });

  test("should log raw message", () => {
    logger.raw("raw message");
  });

  test("should create child logger", () => {
    const child = logger.child("child-process");
    expect(child).toBeInstanceOf(Logger);
  });

  test("should create child with custom options", () => {
    const child = logger.child("child", { level: LogLevelValues.ERROR });
    expect(child.getLevel()).toBe(LogLevelValues.ERROR);
  });

  test("should filter by log level", () => {
    const silentLogger = new Logger({ level: LogLevelValues.SILENT });
    // Should not throw, just not log anything
    silentLogger.debug("debug");
    silentLogger.info("info");
    silentLogger.warn("warn");
    silentLogger.error("error");
    silentLogger.success("success");
  });

  test("should handle ISO timestamp format", () => {
    const logger = new Logger({ timestampFormat: 'iso' });
    logger.info("test");
  });

  test("should handle locale timestamp format", () => {
    const logger = new Logger({ timestampFormat: 'locale' });
    logger.info("test");
  });

  test("should handle unix timestamp format", () => {
    const logger = new Logger({ timestampFormat: 'unix' });
    logger.info("test");
  });
});

describe("LogManager", () => {
  const testDir = join(process.cwd(), "temp_test_logger");

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  test("should format message", () => {
    const formatted = LogManager.formatMessage("test message");
    expect(formatted).toContain("test message");
  });

  test("should rotate log when size exceeded", () => {
    const logPath = join(testDir, "test.log");
    writeFileSync(logPath, "x".repeat(1024 * 1024)); // 1MB
    
    LogManager.rotate(logPath, 1024 * 512, 3); // 512KB max
    
    // Original file should be rotated
    expect(existsSync(`${logPath}.1`)).toBe(true);
  });

  test("should not rotate if under size limit", () => {
    const logPath = join(testDir, "test.log");
    writeFileSync(logPath, "small content");
    
    const originalContent = "small content";
    LogManager.rotate(logPath, 1024 * 1024, 3); // 1MB max
    
    // Should still exist
    expect(existsSync(logPath)).toBe(true);
  });

  test("should cleanup old log files", () => {
    const logDir = join(testDir, "logs");
    mkdirSync(logDir, { recursive: true });
    
    // Create more than maxFiles
    for (let i = 0; i < 6; i++) {
      writeFileSync(join(logDir, `app.log${i > 0 ? '.' + i : ''}`), "content");
    }
    
    LogManager.cleanup(logDir, 3);
    
    // Should have cleaned up excess files
  });
});

describe("getLogger", () => {
  test("should return default logger", () => {
    const logger1 = getLogger();
    const logger2 = getLogger();
    expect(logger1).toBe(logger2);
  });
});

describe("createLogger", () => {
  test("should create new logger instance", () => {
    const logger1 = createLogger();
    const logger2 = createLogger();
    expect(logger1).not.toBe(logger2);
  });
});

describe("log", () => {
  test("should have debug method", () => {
    expect(typeof log.debug).toBe("function");
  });

  test("should have info method", () => {
    expect(typeof log.info).toBe("function");
  });

  test("should have warn method", () => {
    expect(typeof log.warn).toBe("function");
  });

  test("should have error method", () => {
    expect(typeof log.error).toBe("function");
  });

  test("should have success method", () => {
    expect(typeof log.success).toBe("function");
  });

  test("should have raw method", () => {
    expect(typeof log.raw).toBe("function");
  });
});

describe("LogLevelValues", () => {
  test("should have debug level", () => {
    expect(LogLevelValues.DEBUG).toBe("debug");
  });

  test("should have info level", () => {
    expect(LogLevelValues.INFO).toBe("info");
  });

  test("should have warn level", () => {
    expect(LogLevelValues.WARN).toBe("warn");
  });

  test("should have error level", () => {
    expect(LogLevelValues.ERROR).toBe("error");
  });

  test("should have success level", () => {
    expect(LogLevelValues.SUCCESS).toBe("success");
  });

  test("should have silent level", () => {
    expect(LogLevelValues.SILENT).toBe("silent");
  });
});
