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

    test("should start and stop a process", async () => {
        // Use a process that stays alive for a bit
        process = new ManagedProcess({ 
            name: "ping", 
            script: "sleep", 
            args: ["1"] 
        });
        
        await process.start();
        let status = process.getStatus();
        expect(status.pid).toBeDefined();
        expect(status.killed).toBe(false);
        
        process.stop();
        status = process.getStatus();
        // Subprocess might take a moment to report killed/exit
        expect(status.killed).toBe(true);
    });

    test("should handle exit code", async () => {
        process = new ManagedProcess({ 
            name: "exit-1", 
            script: "bun", 
            args: ["-e", "process.exit(1)"],
            autorestart: false // Disable restart for testing
        });
        
        await process.start();
        
        // Wait for process to exit
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const status = process.getStatus();
        expect(status.exitCode).toBe(1);
    });
});
