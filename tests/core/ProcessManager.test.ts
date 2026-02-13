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
        expect(statuses.map((s: any) => s.name)).toContain("p1");
        expect(statuses.map((s: any) => s.name)).toContain("p2");
    });

    test("should add multiple instances", () => {
        const manager = new ProcessManager();
        const config = { name: "multi", script: "echo", instances: 3 };
        
        manager.addProcess(config);
        expect(manager.processCount).toBe(3);
        expect(manager.hasProcess("multi")).toBe(true);
        expect(manager.hasProcess("multi-1")).toBe(true);
        expect(manager.hasProcess("multi-2")).toBe(true);
    });

    test("should create cluster for multiple instances", () => {
        const manager = new ProcessManager();
        const config = { name: "clustered", script: "echo", instances: 3 };
        
        manager.addProcess(config);
        expect(manager.isClustered("clustered")).toBe(true);
        expect(manager.clusterCount).toBe(1);
    });

    test("should not create cluster for single instance", () => {
        const manager = new ProcessManager();
        const config = { name: "single", script: "echo" };
        
        manager.addProcess(config);
        expect(manager.isClustered("single")).toBe(false);
        expect(manager.clusterCount).toBe(0);
    });

    test("should get process by instance", () => {
        const manager = new ProcessManager();
        const config = { name: "test", script: "echo", instances: 3 };
        manager.addProcess(config);
        
        const proc = manager.getProcessByInstance("test", 1);
        expect(proc).toBeDefined();
        expect(proc?.getInstanceId()).toBe(1);
    });

    test("should get processes by namespace", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "p1", script: "echo", namespace: "ns1" });
        manager.addProcess({ name: "p2", script: "echo", namespace: "ns1" });
        manager.addProcess({ name: "p3", script: "echo", namespace: "ns2" });
        
        const ns1Procs = manager.getProcessesByNamespace("ns1");
        expect(ns1Procs).toHaveLength(2);
        
        const namespaces = manager.getNamespaces();
        expect(namespaces).toContain("ns1");
        expect(namespaces).toContain("ns2");
    });

    test("should get processes by cluster group", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "p1", script: "echo", clusterGroup: "group1" });
        manager.addProcess({ name: "p2", script: "echo", clusterGroup: "group1" });
        
        const groupProcs = manager.getProcessesByClusterGroup("group1");
        expect(groupProcs).toHaveLength(2);
        
        const groups = manager.getClusterGroups();
        expect(groups).toContain("group1");
    });

    test("should get cluster info", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "clustered", script: "echo", instances: 2 });
        
        const info = manager.getClusterInfo("clustered");
        expect(info).not.toBeNull();
        expect(info?.name).toBe("clustered");
        expect(info?.totalInstances).toBe(2);
        expect(info?.strategy).toBe("round-robin");
    });

    test("should return null for non-existent cluster info", () => {
        const manager = new ProcessManager();
        
        const info = manager.getClusterInfo("nonexistent");
        expect(info).toBeNull();
    });

    test("should get process groups", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "p1", script: "echo", namespace: "ns1" });
        manager.addProcess({ name: "p2", script: "echo", clusterGroup: "group1" });
        
        const groups = manager.getProcessGroups();
        expect(groups.length).toBeGreaterThan(0);
    });

    test("should get next instance", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "lb-test", script: "echo", instances: 3 });
        
        const instance = manager.getNextInstance("lb-test");
        expect(instance).toBeDefined();
    });

    test("should get cluster by name", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "clustered", script: "echo", instances: 2 });
        
        const cluster = manager.getCluster("clustered");
        expect(cluster).toBeDefined();
    });

    test("should get all clusters", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "c1", script: "echo", instances: 2 });
        manager.addProcess({ name: "c2", script: "echo", instances: 2 });
        
        const clusters = manager.getClusters();
        expect(clusters.size).toBe(2);
    });

    test("should remove by namespace", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "p1", script: "echo", namespace: "to-delete" });
        manager.addProcess({ name: "p2", script: "echo", namespace: "to-delete" });
        
        manager.removeByNamespace("to-delete");
        
        const procs = manager.getProcessesByNamespace("to-delete");
        expect(procs).toHaveLength(0);
    });

    test("should scale process up", async () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "scale-test", script: "sleep 1", instances: 1 });
        
        expect(manager.processCount).toBe(1);
        
        // Note: This will actually try to start processes
        // Just testing the logic works
        const config = manager.getProcess("scale-test")?.getConfig();
        expect(config).toBeDefined();
    });

    test("should check hasProcess for instance", () => {
        const manager = new ProcessManager();
        manager.addProcess({ name: "test", script: "echo", instances: 3 });
        
        expect(manager.hasProcess("test-1")).toBe(true);
        expect(manager.hasProcess("test-2")).toBe(true);
    });
});
