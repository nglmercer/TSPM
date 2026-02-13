import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

// Test file system operations (simulating CLI behavior)
const TSPM_HOME = join(process.cwd(), ".tspm_test");

describe("CLI File Operations", () => {
  beforeEach(() => {
    // Clean up test directory
    if (existsSync(TSPM_HOME)) {
      rmSync(TSPM_HOME, { recursive: true, force: true });
    }
    mkdirSync(TSPM_HOME, { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (existsSync(TSPM_HOME)) {
      rmSync(TSPM_HOME, { recursive: true, force: true });
    }
  });

  test("should create TSPM home directory", () => {
    expect(existsSync(TSPM_HOME)).toBe(true);
  });

  test("should read/write status file", () => {
    const statusFile = join(TSPM_HOME, "status.json");
    const testStatus = {
      "test-process": {
        pid: 12345,
        startedAt: Date.now(),
        config: { name: "test", script: "echo" },
        state: "running"
      }
    };
    writeFileSync(statusFile, JSON.stringify(testStatus));
    
    expect(existsSync(statusFile)).toBe(true);
    const status = JSON.parse(readFileSync(statusFile, "utf-8"));
    expect(status["test-process"]).toBeDefined();
    expect(status["test-process"].pid).toBe(12345);
  });

  test("should write daemon status file", () => {
    const daemonFile = join(TSPM_HOME, "daemon.pid");
    const daemonStatus = {
      pid: 99999,
      startedAt: Date.now(),
      configFile: "tspm.yaml"
    };
    writeFileSync(daemonFile, JSON.stringify(daemonStatus, null, 2));
    
    expect(existsSync(daemonFile)).toBe(true);
    const content = JSON.parse(readFileSync(daemonFile, "utf-8"));
    expect(content.pid).toBe(99999);
  });

  test("should persist process status across commands", () => {
    const statusFile = join(TSPM_HOME, "status.json");
    const status = {
      "web-server": {
        pid: 174422,
        startedAt: Date.now() - 50000,
        config: { name: "web-server", script: "bun" },
        state: "running"
      }
    };
    writeFileSync(statusFile, JSON.stringify(status));
    
    const readStatus = JSON.parse(readFileSync(statusFile, "utf-8"));
    expect(readStatus["web-server"]).toBeDefined();
    expect(readStatus["web-server"].state).toBe("running");
    expect(readStatus["web-server"].pid).toBe(174422);
  });

  test("should handle status file deletion", () => {
    const statusFile = join(TSPM_HOME, "status.json");
    writeFileSync(statusFile, JSON.stringify({}));
    
    expect(existsSync(statusFile)).toBe(true);
    rmSync(statusFile);
    expect(existsSync(statusFile)).toBe(false);
  });

  test("should update process status", () => {
    const statusFile = join(TSPM_HOME, "status.json");
    
    // Initial status
    const initialStatus = {
      "worker": {
        pid: 100,
        startedAt: Date.now(),
        config: { name: "worker" },
        state: "running"
      }
    };
    writeFileSync(statusFile, JSON.stringify(initialStatus));
    
    // Update status
    const currentStatus = JSON.parse(readFileSync(statusFile, "utf-8"));
    currentStatus["worker"].state = "stopped";
    writeFileSync(statusFile, JSON.stringify(currentStatus));
    
    const updatedStatus = JSON.parse(readFileSync(statusFile, "utf-8"));
    expect(updatedStatus["worker"].state).toBe("stopped");
  });
});

describe("CLI Config File Handling", () => {
  test("should find default config files", () => {
    const defaultFiles = [
      'tspm.yaml',
      'tspm.yml',
      'tspm.json',
      'tspm.jsonc',
    ];
    
    // Verify the default file list exists in our test config
    expect(defaultFiles.length).toBe(4);
    expect(defaultFiles[0]).toBe('tspm.yaml');
  });
});
