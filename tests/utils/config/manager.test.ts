import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { ConfigManager } from "../../../src/utils/config/manager";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("ConfigManager", () => {
  const testDir = join(process.cwd(), "temp_test_manager");

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

  test("should discover config file", () => {
    const manager = new ConfigManager({ cwd: testDir });
    const configPath = join(testDir, "tspm.yaml");
    writeFileSync(configPath, "processes: []");
    
    expect(manager.discoverConfigFile()).toBe(configPath);
  });

  test("should load config correctly", async () => {
    const manager = new ConfigManager({ cwd: testDir });
    const configPath = join(testDir, "tspm.json");
    const config = {
      processes: [{ name: "test", script: "echo hello" }]
    };
    writeFileSync(configPath, JSON.stringify(config));
    
    const loaded = await manager.load("tspm.json");
    expect(loaded.processes[0].name).toBe("test");
  });

  test("init should create directories and sample config", async () => {
    const manager = new ConfigManager({ cwd: testDir });
    await manager.init({ format: "yaml" });
    
    expect(existsSync(join(testDir, "logs"))).toBe(true);
    expect(existsSync(join(testDir, ".pids"))).toBe(true);
    expect(existsSync(join(testDir, "tspm.yaml"))).toBe(true);
  });

  test("should handle validation errors on load", async () => {
    const manager = new ConfigManager({ cwd: testDir });
    const configPath = join(testDir, "tspm.json");
    writeFileSync(configPath, JSON.stringify({ processes: "not-an-array" }));
    
    expect(manager.load("tspm.json")).rejects.toThrow("Configuration validation failed");
  });
});
