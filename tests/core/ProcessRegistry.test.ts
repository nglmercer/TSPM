import { expect, test, describe, beforeEach } from "bun:test";
import { ProcessRegistry } from "../../src/core/ProcessRegistry";

describe("ProcessRegistry", () => {
    let registry: ProcessRegistry;

    const createMockProcess = (name: string, namespace?: string, clusterGroup?: string) => ({
        getConfig: () => ({
            name,
            script: "echo",
            namespace,
            clusterGroup
        })
    });

    beforeEach(() => {
        registry = new ProcessRegistry();
    });

    test("should add and retrieve process", () => {
        const process = createMockProcess("test");
        registry.add("test", process as any);
        
        expect(registry.has("test")).toBe(true);
        expect(registry.get("test")).toBe(process);
        expect(registry.size).toBe(1);
    });

    test("should return undefined for non-existent process", () => {
        expect(registry.get("non-existent")).toBeUndefined();
    });

    test("should delete process", () => {
        const process = createMockProcess("test");
        registry.add("test", process as any);
        
        const deleted = registry.delete("test");
        expect(deleted).toBe(true);
        expect(registry.has("test")).toBe(false);
        expect(registry.size).toBe(0);
    });

    test("should return false when deleting non-existent process", () => {
        const deleted = registry.delete("non-existent");
        expect(deleted).toBe(false);
    });

    test("should get all processes", () => {
        const p1 = createMockProcess("p1");
        const p2 = createMockProcess("p2");
        
        registry.add("p1", p1 as any);
        registry.add("p2", p2 as any);
        
        const all = registry.getAll();
        expect(all).toHaveLength(2);
        expect(all).toContain(p1);
        expect(all).toContain(p2);
    });

    test("should get processes by namespace", () => {
        const p1 = createMockProcess("p1", "ns1");
        const p2 = createMockProcess("p2", "ns1");
        const p3 = createMockProcess("p3", "ns2");
        
        registry.add("p1", p1 as any);
        registry.add("p2", p2 as any);
        registry.add("p3", p3 as any);
        
        const ns1 = registry.getByNamespace("ns1");
        expect(ns1).toHaveLength(2);
        
        const ns2 = registry.getByNamespace("ns2");
        expect(ns2).toHaveLength(1);
        
        const ns3 = registry.getByNamespace("ns3");
        expect(ns3).toHaveLength(0);
    });

    test("should get processes by cluster group", () => {
        const p1 = createMockProcess("p1", undefined, "g1");
        const p2 = createMockProcess("p2", undefined, "g1");
        
        registry.add("p1", p1 as any);
        registry.add("p2", p2 as any);
        
        const g1 = registry.getByClusterGroup("g1");
        expect(g1).toHaveLength(2);
    });

    test("should get namespaces", () => {
        const p1 = createMockProcess("p1", "ns1");
        const p2 = createMockProcess("p2", "ns2");
        
        registry.add("p1", p1 as any);
        registry.add("p2", p2 as any);
        
        const namespaces = registry.getNamespaces();
        expect(namespaces).toHaveLength(2);
        expect(namespaces).toContain("ns1");
        expect(namespaces).toContain("ns2");
    });

    test("should clean up namespace index on delete", () => {
        const process = createMockProcess("test", "ns1");
        registry.add("test", process as any);
        
        expect(registry.getByNamespace("ns1")).toHaveLength(1);
        
        registry.delete("test");
        expect(registry.getByNamespace("ns1")).toHaveLength(0);
    });

    test("should clean up cluster group index on delete", () => {
        const process = createMockProcess("test", undefined, "g1");
        registry.add("test", process as any);
        
        expect(registry.getByClusterGroup("g1")).toHaveLength(1);
        
        registry.delete("test");
        expect(registry.getByClusterGroup("g1")).toHaveLength(0);
    });
});
