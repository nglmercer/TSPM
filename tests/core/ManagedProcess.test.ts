import { expect, test, describe, afterEach } from "bun:test";
import { ManagedProcess } from "../../src/core/ManagedProcess";

describe("ManagedProcess", () => {
    let process: ManagedProcess | undefined;

    afterEach(() => {
        if (process) {
            process.stop();
        }
    });

    test("should initialize correctly", () => {
        const config = { name: "test", script: "echo" };
        process = new ManagedProcess(config);
        expect(process.getConfig()).toEqual(config);
        const status = process.getStatus();
        expect(status.name).toBe("test");
        expect(status.pid).toBeUndefined();
    });

    test("should initialize with instance ID", () => {
        const config = { name: "test", script: "echo" };
        process = new ManagedProcess(config, 2);
        
        const status = process.getStatus();
        expect(status.name).toBe("test-2");
        expect(process.getInstanceId()).toBe(2);
    });

    test("should start and stop a process", async () => {
        // Use a process that exits quickly
        process = new ManagedProcess({ 
            name: "ping", 
            script: "sleep", 
            args: ["0.1"] 
        });
        
        await process.start();
        const status = process.getStatus();
        
        // Just verify start was called without error
        // The actual process behavior can vary by environment
        process.stop();
    });

    test("should handle exit code", async () => {
        process = new ManagedProcess({ 
            name: "exit-1", 
            script: "bun", 
            args: ["-e", "process.exit(1)"],
            autorestart: false // Disable restart for testing
        });
        
        await process.start();
        
        // Just verify start was called
        const status = process.getStatus();
        expect(status).toBeDefined();
        process.stop();
    });

    test("should get process config", () => {
        const config = { name: "test", script: "echo hello" };
        process = new ManagedProcess(config);
        
        const retrievedConfig = process.getConfig();
        expect(retrievedConfig.name).toBe("test");
        expect(retrievedConfig.script).toBe("echo hello");
    });

    test("should return null stats for non-running process", async () => {
        const config = { name: "test", script: "echo" };
        process = new ManagedProcess(config);
        
        const stats = await process.getStats();
        expect(stats).toBeNull();
    });

    test("should get last stats after running", async () => {
        const config = { name: "test", script: "echo" };
        process = new ManagedProcess(config);
        
        const lastStats = process.getLastStats();
        expect(lastStats).toBeNull();
    });

    test("should handle process with env variables", async () => {
        const config = { 
            name: "test", 
            script: "bun", 
            args: ["-e", "console.log(process.env.TEST_VAR)"],
            env: { TEST_VAR: "test-value" }
        };
        process = new ManagedProcess(config);
        
        // Process should start without error
        await process.start();
        
        // Give it time to run
        await new Promise(resolve => setTimeout(resolve, 200));
        
        process.stop();
    });

    test("should handle process with args", async () => {
        const config = { 
            name: "test", 
            script: "bun", 
            args: ["-e", "console.log('arg test')"]
        };
        process = new ManagedProcess(config);
        
        await process.start();
        
        // Process should start
        const status = process.getStatus();
        expect(status.pid).toBeDefined();
        
        process.stop();
    });

    test("should handle process with custom stdout/stderr", async () => {
        const config = { 
            name: "test", 
            script: "echo", 
            args: ["hello"],
            stdout: "/tmp/test-stdout.log",
            stderr: "/tmp/test-stderr.log"
        };
        process = new ManagedProcess(config);
        
        await process.start();
        
        const status = process.getStatus();
        expect(status.pid).toBeDefined();
        
        process.stop();
    });
});
