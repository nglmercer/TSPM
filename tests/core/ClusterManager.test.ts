import { expect, test, describe, beforeEach } from "bun:test";
import { ClusterManager } from "../../src/core/ClusterManager";
import { LoadBalanceStrategyValues } from "../../src/utils/loadbalancer";

describe("ClusterManager", () => {
    let manager: ClusterManager;

    beforeEach(() => {
        manager = new ClusterManager();
    });

    test("should return undefined for single instance config", () => {
        const config = { name: "single", script: "echo", instances: 1 } as unknown as import('../../src/core/types').ProcessConfig;
        const cluster = manager.getOrCreateCluster(config);
        expect(cluster).toBeUndefined();
        expect(manager.size).toBe(0);
    });

    test("should create cluster for multiple instances", () => {
        const config = { name: "multi", script: "echo", instances: 2 } as unknown as import('../../src/core/types').ProcessConfig;
        const cluster = manager.getOrCreateCluster(config);
        
        expect(cluster).toBeDefined();
        expect(cluster?.getName()).toBe("multi");
        expect(manager.size).toBe(1);
    });

    test("should return existing cluster", () => {
        const config = { name: "multi", script: "echo", instances: 2 } as unknown as import('../../src/core/types').ProcessConfig;
        const cluster1 = manager.getOrCreateCluster(config);
        const cluster2 = manager.getOrCreateCluster(config);
        
        expect(cluster1).toBe(cluster2);
        expect(manager.size).toBe(1);
    });

    test("should use specified lb strategy", () => {
        const config = { 
            name: "strategy-test", 
            script: "echo", 
            instances: 2,
            lbStrategy: LoadBalanceStrategyValues.RANDOM 
        };
        
        const cluster = manager.getOrCreateCluster(config as unknown as import('../../src/core/types').ProcessConfig);
        expect(cluster?.getStrategy()).toBe(LoadBalanceStrategyValues.RANDOM);
    });

    test("should get cluster by name", () => {
        const config = { name: "test", script: "echo", instances: 2 } as unknown as import('../../src/core/types').ProcessConfig;
        manager.getOrCreateCluster(config);
        
        const cluster = manager.getCluster("test");
        expect(cluster).toBeDefined();
        expect(cluster?.getName()).toBe("test");
    });

    test("should return undefined for non-existent cluster", () => {
        const cluster = manager.getCluster("non-existent");
        expect(cluster).toBeUndefined();
    });

    test("should remove cluster", () => {
        const config = { name: "remove-test", script: "echo", instances: 2 } as unknown as import('../../src/core/types').ProcessConfig;
        manager.getOrCreateCluster(config);
        
        expect(manager.getCluster("remove-test")).toBeDefined();
        
        manager.removeCluster("remove-test");
        expect(manager.getCluster("remove-test")).toBeUndefined();
        expect(manager.size).toBe(0);
    });

    test("should get all clusters", () => {
        const config1 = { name: "c1", script: "echo", instances: 2 } as unknown as import('../../src/core/types').ProcessConfig;
        const config2 = { name: "c2", script: "echo", instances: 2 } as unknown as import('../../src/core/types').ProcessConfig;
        
        manager.getOrCreateCluster(config1);
        manager.getOrCreateCluster(config2);
        
        const clusters = manager.getAllClusters();
        expect(clusters.size).toBe(2);
        expect(clusters.has("c1")).toBe(true);
        expect(clusters.has("c2")).toBe(true);
    });
});
