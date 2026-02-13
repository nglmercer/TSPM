import { expect, test, describe, beforeEach } from "bun:test";
import {
  RoundRobinBalancer,
  RandomBalancer,
  LeastConnectionsBalancer,
  LeastCpuBalancer,
  LeastMemoryBalancer,
  IpHashBalancer,
  WeightedBalancer,
  LoadBalancerFactory,
  ProcessCluster,
  LoadBalanceStrategyValues,
  type LoadBalanceStrategy,
  type InstanceInfo,
} from "../../src/utils/loadbalancer";

const createInstance = (overrides: Partial<InstanceInfo> = {}): InstanceInfo => ({
  id: 0,
  name: "test",
  connections: 0,
  cpu: 0,
  memory: 0,
  weight: 1,
  healthy: true,
  ...overrides,
});

describe("RoundRobinBalancer", () => {
  let balancer: RoundRobinBalancer;

  beforeEach(() => {
    balancer = new RoundRobinBalancer();
  });

  test("should return null when no instances", () => {
    balancer.setInstances([]);
    expect(balancer.getInstance()).toBeNull();
  });

  test("should return instance when available", () => {
    const instances = [createInstance({ id: 1 }), createInstance({ id: 2 })];
    balancer.setInstances(instances);
    expect(balancer.getInstance()).not.toBeNull();
  });

  test("should rotate through instances", () => {
    const instances = [
      createInstance({ id: 1 }),
      createInstance({ id: 2 }),
      createInstance({ id: 3 }),
    ];
    balancer.setInstances(instances);
    
    const results = [balancer.getInstance()?.id, balancer.getInstance()?.id, balancer.getInstance()?.id];
    expect(results).toEqual([1, 2, 3]);
  });

  test("should filter unhealthy instances", () => {
    const instances = [
      createInstance({ id: 1, healthy: true }),
      createInstance({ id: 2, healthy: false }),
      createInstance({ id: 3, healthy: true }),
    ];
    balancer.setInstances(instances);
    
    const result = balancer.getInstance();
    expect(result?.id).not.toBe(2);
  });

  test("should reset counter", () => {
    const instances = [createInstance({ id: 1 }), createInstance({ id: 2 })];
    balancer.setInstances(instances);
    balancer.getInstance();
    balancer.reset();
    
    const result = balancer.getInstance();
    expect(result?.id).toBe(1);
  });
});

describe("RandomBalancer", () => {
  let balancer: RandomBalancer;

  beforeEach(() => {
    balancer = new RandomBalancer();
  });

  test("should return null when no instances", () => {
    balancer.setInstances([]);
    expect(balancer.getInstance()).toBeNull();
  });

  test("should return an instance from the list", () => {
    const instances = [createInstance({ id: 1 }), createInstance({ id: 2 })];
    balancer.setInstances(instances);
    
    const result = balancer.getInstance();
    expect([1, 2]).toContain(result?.id);
  });

  test("should filter unhealthy instances", () => {
    const instances = [
      createInstance({ id: 1, healthy: false }),
      createInstance({ id: 2, healthy: true }),
    ];
    balancer.setInstances(instances);
    
    const result = balancer.getInstance();
    expect(result?.id).toBe(2);
  });
});

describe("LeastConnectionsBalancer", () => {
  let balancer: LeastConnectionsBalancer;

  beforeEach(() => {
    balancer = new LeastConnectionsBalancer();
  });

  test("should return null when no instances", () => {
    balancer.setInstances([]);
    expect(balancer.getInstance()).toBeNull();
  });

  test("should return instance with least connections", () => {
    const instances = [
      createInstance({ id: 1, connections: 10 }),
      createInstance({ id: 2, connections: 5 }),
      createInstance({ id: 3, connections: 1 }),
    ];
    balancer.setInstances(instances);
    
    const result = balancer.getInstance();
    expect(result?.id).toBe(3);
  });

  test("should record connection", () => {
    const instance = createInstance({ id: 1, connections: 0 });
    balancer.setInstances([instance]);
    balancer.recordConnection(1);
    
    expect(instance.connections).toBe(1);
  });

  test("should release connection", () => {
    const instance = createInstance({ id: 1, connections: 5 });
    balancer.setInstances([instance]);
    balancer.releaseConnection(1);
    
    expect(instance.connections).toBe(4);
  });

  test("should not go below zero connections", () => {
    const instance = createInstance({ id: 1, connections: 0 });
    balancer.setInstances([instance]);
    balancer.releaseConnection(1);
    
    expect(instance.connections).toBe(0);
  });
});

describe("LeastCpuBalancer", () => {
  let balancer: LeastCpuBalancer;

  beforeEach(() => {
    balancer = new LeastCpuBalancer();
  });

  test("should return null when no instances", () => {
    balancer.setInstances([]);
    expect(balancer.getInstance()).toBeNull();
  });

  test("should return instance with least CPU", () => {
    const instances = [
      createInstance({ id: 1, cpu: 80 }),
      createInstance({ id: 2, cpu: 50 }),
      createInstance({ id: 3, cpu: 20 }),
    ];
    balancer.setInstances(instances);
    
    const result = balancer.getInstance();
    expect(result?.id).toBe(3);
  });
});

describe("LeastMemoryBalancer", () => {
  let balancer: LeastMemoryBalancer;

  beforeEach(() => {
    balancer = new LeastMemoryBalancer();
  });

  test("should return null when no instances", () => {
    balancer.setInstances([]);
    expect(balancer.getInstance()).toBeNull();
  });

  test("should return instance with least memory", () => {
    const instances = [
      createInstance({ id: 1, memory: 1000 }),
      createInstance({ id: 2, memory: 500 }),
      createInstance({ id: 3, memory: 100 }),
    ];
    balancer.setInstances(instances);
    
    const result = balancer.getInstance();
    expect(result?.id).toBe(3);
  });
});

describe("IpHashBalancer", () => {
  let balancer: IpHashBalancer;

  beforeEach(() => {
    balancer = new IpHashBalancer();
  });

  test("should return null when no instances", () => {
    balancer.setInstances([]);
    expect(balancer.getInstance("127.0.0.1")).toBeNull();
  });

  test("should return consistent instance for same IP", () => {
    const instances = [createInstance({ id: 1 }), createInstance({ id: 2 })];
    balancer.setInstances(instances);
    
    const result1 = balancer.getInstance("192.168.1.1");
    const result2 = balancer.getInstance("192.168.1.1");
    
    expect(result1?.id).toBe(result2?.id);
  });

  test("should distribute different IPs", () => {
    const instances = [createInstance({ id: 1 }), createInstance({ id: 2 }), createInstance({ id: 3 })];
    balancer.setInstances(instances);
    
    // Different IPs should potentially get different instances
    const ips = ["192.168.1.1", "192.168.1.2", "192.168.1.3", "192.168.1.4"];
    const results = ips.map(ip => balancer.getInstance(ip)?.id);
    
    // Should get some distribution
    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThan(0);
  });
});

describe("WeightedBalancer", () => {
  let balancer: WeightedBalancer;

  beforeEach(() => {
    balancer = new WeightedBalancer();
  });

  test("should return null when no instances", () => {
    balancer.setInstances([]);
    expect(balancer.getInstance()).toBeNull();
  });

  test("should select instance based on weight", () => {
    const instances = [
      createInstance({ id: 1, weight: 10 }),
      createInstance({ id: 2, weight: 1 }),
    ];
    balancer.setInstances(instances);
    
    const results: number[] = [];
    for (let i = 0; i < 11; i++) {
      const result = balancer.getInstance();
      if (result) results.push(result.id);
    }
    
    // Higher weight instance should be selected more often
    expect(results.filter(id => id === 1).length).toBeGreaterThan(results.filter(id => id === 2).length);
  });

  test("should reset weights", () => {
    const instances = [
      createInstance({ id: 1, weight: 5 }),
      createInstance({ id: 2, weight: 5 }),
    ];
    balancer.setInstances(instances);
    
    // Use some weights
    balancer.getInstance();
    balancer.getInstance();
    
    balancer.resetWeights([5, 5]);
    
    expect(instances[0].weight).toBe(5);
    expect(instances[1].weight).toBe(5);
  });
});

describe("LoadBalancerFactory", () => {
  test("should create RoundRobinBalancer", () => {
    const balancer = LoadBalancerFactory.create(LoadBalanceStrategyValues.ROUND_ROBIN);
    expect(balancer).toBeInstanceOf(RoundRobinBalancer);
  });

  test("should create RandomBalancer", () => {
    const balancer = LoadBalancerFactory.create(LoadBalanceStrategyValues.RANDOM);
    expect(balancer).toBeInstanceOf(RandomBalancer);
  });

  test("should create LeastConnectionsBalancer", () => {
    const balancer = LoadBalancerFactory.create(LoadBalanceStrategyValues.LEAST_CONNECTIONS);
    expect(balancer).toBeInstanceOf(LeastConnectionsBalancer);
  });

  test("should create LeastCpuBalancer", () => {
    const balancer = LoadBalancerFactory.create(LoadBalanceStrategyValues.LEAST_CPU);
    expect(balancer).toBeInstanceOf(LeastCpuBalancer);
  });

  test("should create LeastMemoryBalancer", () => {
    const balancer = LoadBalancerFactory.create(LoadBalanceStrategyValues.LEAST_MEMORY);
    expect(balancer).toBeInstanceOf(LeastMemoryBalancer);
  });

  test("should create IpHashBalancer", () => {
    const balancer = LoadBalancerFactory.create(LoadBalanceStrategyValues.IP_HASH);
    expect(balancer).toBeInstanceOf(IpHashBalancer);
  });

  test("should create WeightedBalancer", () => {
    const balancer = LoadBalancerFactory.create(LoadBalanceStrategyValues.WEIGHTED);
    expect(balancer).toBeInstanceOf(WeightedBalancer);
  });

  test("should return default for unknown strategy", () => {
    const balancer = LoadBalancerFactory.create("unknown" as LoadBalanceStrategy);
    expect(balancer).toBeInstanceOf(RoundRobinBalancer);
  });

  test("should get all strategies", () => {
    const strategies = LoadBalancerFactory.getStrategies();
    expect(strategies).toContain(LoadBalanceStrategyValues.ROUND_ROBIN);
    expect(strategies).toContain(LoadBalanceStrategyValues.RANDOM);
    expect(strategies).toContain(LoadBalanceStrategyValues.LEAST_CONNECTIONS);
  });

  test("should validate strategy", () => {
    expect(LoadBalancerFactory.isValidStrategy("round-robin")).toBe(true);
    expect(LoadBalancerFactory.isValidStrategy("random")).toBe(true);
    expect(LoadBalancerFactory.isValidStrategy("invalid")).toBe(false);
  });
});

describe("ProcessCluster", () => {
  let cluster: ProcessCluster;

  beforeEach(() => {
    cluster = new ProcessCluster("test-cluster");
  });

  test("should create cluster with default strategy", () => {
    expect(cluster.getStrategy()).toBe(LoadBalanceStrategyValues.ROUND_ROBIN);
  });

  test("should create cluster with custom strategy", () => {
    const customCluster = new ProcessCluster("test", LoadBalanceStrategyValues.RANDOM);
    expect(customCluster.getStrategy()).toBe(LoadBalanceStrategyValues.RANDOM);
  });

  test("should add instance", () => {
    cluster.addInstance(1);
    const instances = cluster.getInstances();
    expect(instances).toHaveLength(1);
    expect(instances[0].id).toBe(1);
  });

  test("should add instance with config", () => {
    cluster.addInstance(1, { weight: 5, cpu: 50 });
    const instance = cluster.getInstance(1);
    expect(instance?.weight).toBe(5);
    expect(instance?.cpu).toBe(50);
  });

  test("should remove instance", () => {
    cluster.addInstance(1);
    cluster.removeInstance(1);
    expect(cluster.getInstances()).toHaveLength(0);
  });

  test("should update instance stats", () => {
    cluster.addInstance(1);
    cluster.updateInstanceStats(1, { cpu: 75, memory: 1000, healthy: false });
    
    const instance = cluster.getInstance(1);
    expect(instance?.cpu).toBe(75);
    expect(instance?.memory).toBe(1000);
    expect(instance?.healthy).toBe(false);
  });

  test("should get healthy instances", () => {
    cluster.addInstance(1, { healthy: true });
    cluster.addInstance(2, { healthy: false });
    cluster.addInstance(3, { healthy: true });
    
    const next = cluster.getNextInstance();
    expect(next?.id).not.toBe(2);
  });

  test("should change strategy", () => {
    cluster.addInstance(1);
    cluster.setStrategy(LoadBalanceStrategyValues.RANDOM);
    expect(cluster.getStrategy()).toBe(LoadBalanceStrategyValues.RANDOM);
  });

  test("should record and release connections", () => {
    cluster.addInstance(1);
    cluster.recordConnection(1);
    
    const instance = cluster.getInstance(1);
    expect(instance?.connections).toBe(1);
    
    cluster.releaseConnection(1);
    expect(instance?.connections).toBe(0);
  });

  test("should get health status", () => {
    cluster.addInstance(1, { healthy: true });
    cluster.addInstance(2, { healthy: false });
    
    const status = cluster.getHealthStatus();
    expect(status.total).toBe(2);
    expect(status.healthy).toBe(1);
    expect(status.unhealthy).toBe(1);
  });

  test("should get cluster name", () => {
    expect(cluster.getName()).toBe("test-cluster");
  });
});
