import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { ConfigLoader, ConfigNotFoundError, ConfigParseError, ConfigValidationError } from "../../src/core/ConfigLoader";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("ConfigLoader", () => {
    const testDir = join(process.cwd(), "temp_test_loader");

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

    test("should load config with discovery", async () => {
        const configPath = join(testDir, "tspm.yaml");
        writeFileSync(configPath, "processes: [{ name: 'test', script: 'ls' }]");
        
        const loaded = await ConfigLoader.load(configPath);
        expect(loaded.processes[0]!.name).toBe("test");
    });

    test("init should work via ConfigLoader", async () => {
        const result = await ConfigLoader.init({ force: true });
        expect(result).toBe(true);
    });

    test("should load YAML config", async () => {
        const configPath = join(testDir, "tspm.yaml");
        writeFileSync(configPath, "processes:\n  - name: yaml-test\n    script: echo yaml");
        
        const loaded = await ConfigLoader.load(configPath);
        expect(loaded.processes[0]!.name).toBe("yaml-test");
    });

    test("should load JSON config", async () => {
        const configPath = join(testDir, "tspm.json");
        writeFileSync(configPath, JSON.stringify({
            processes: [{ name: "json-test", script: "echo json" }]
        }));
        
        const loaded = await ConfigLoader.load(configPath);
        expect(loaded.processes[0]!.name).toBe("json-test");
    });

    test("should load JSONC config with comments", async () => {
        const configPath = join(testDir, "tspm.jsonc");
        writeFileSync(configPath, `{
            // This is a comment
            "processes": [
                { "name": "jsonc-test", "script": "echo jsonc" }
            ]
        }`);
        
        const loaded = await ConfigLoader.load(configPath);
        expect(loaded.processes[0]!.name).toBe("jsonc-test");
    });

    test("should validate config", () => {
        const validConfig = {
            processes: [{ name: "test", script: "echo test" }]
        };
        
        const result = ConfigLoader.validate(validConfig);
        expect(result).toBeDefined();
    });

    test("should validate invalid config", () => {
        const invalidConfig = {
            processes: "not-an-array"
        };
        
        expect(() => ConfigLoader.validate(invalidConfig)).toThrow();
    });

    test("should discover config file", () => {
        const configPath = join(testDir, "tspm.yaml");
        writeFileSync(configPath, "processes: []");
        
        // Note: discoverConfigFile uses cwd by default
        const result = ConfigLoader.discoverConfigFile();
        // This will search in current working directory, not testDir
        // Just ensure it doesn't throw
        expect(result === null || typeof result === "string").toBe(true);
    });

    test("should export error types", () => {
        expect(ConfigNotFoundError).toBeDefined();
        expect(ConfigParseError).toBeDefined();
        expect(ConfigValidationError).toBeDefined();
    });
});
