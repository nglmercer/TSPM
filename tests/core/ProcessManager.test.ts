import { expect, test, describe } from "bun:test";
import { ProcessManager } from "../../src/core/ProcessManager";

describe("ProcessManager", () => {
    test("should add and remove processes", () => {
        const manager = new ProcessManager();
        const config = { name: "test", script: "echo 1" };
        
        manager.addProcess(config);
        expect(manager.hasProcess("test")).toBe(true);
        expect(manager.processCount).toBe(1);
        
        manager.removeProcess("test");
        expect(manager.hasProcess("test")).toBe(false);
        expect(manager.processCount).toBe(0);
    });

    test("should get process by name", () => {
        const manager = new ProcessManager();
        const config = { name: "test", script: "echo 1" };
        manager.addProcess(config);
        
        const proc = manager.getProcess("test");
        expect(proc).toBeDefined();
        expect(proc?.getConfig().name).toBe("test");
    });

    test("should get statuses", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "p1", script: "echo 1" });
        manager.addProcess({ name: "p2", script: "echo 2" });
        
        const statuses = manager.getStatuses();
        expect(statuses).toHaveLength(2);
        expect(statuses.map(s => s.name)).toContain("p1");
        expect(statuses.map(s => s.name)).toContain("p2");
    });
});
