/**
 * Load Balancing Strategies for Process Clustering
 * Implements various load balancing algorithms for distributing requests across instances
 * @module utils/loadbalancer
 */

/**
 * Load balancing strategy types
 */
export const LoadBalanceStrategyValues = {
  ROUND_ROBIN: 'round-robin',
  RANDOM: 'random',
  LEAST_CONNECTIONS: 'least-connections',
  LEAST_CPU: 'least-cpu',
  LEAST_MEMORY: 'least-memory',
  IP_HASH: 'ip-hash',
  WEIGHTED: 'weighted',
} as const;

export type LoadBalanceStrategy = typeof LoadBalanceStrategyValues[keyof typeof LoadBalanceStrategyValues];

/**
 * Instance information for load balancing
 */
export interface InstanceInfo {
  /** Instance ID */
  id: number;
  /** Process name */
  name: string;
  /** Current number of active connections */
  connections: number;
  /** CPU usage percentage */
  cpu: number;
  /** Memory usage in bytes */
  memory: number;
  /** Weight for weighted load balancing */
  weight: number;
  /** Whether the instance is healthy */
  healthy: boolean;
  /** Current state */
  state?: string;
  /** PID */
  pid?: number;
  /** Start time */
  startedAt?: number;
}

/**
 * Round-robin load balancer
 * Distributes requests equally across all instances
 */
export class RoundRobinBalancer {
  private currentIndex = 0;
  private instances: InstanceInfo[] = [];

  /**
   * Update the list of available instances
   */
  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  /**
   * Get the next instance
   */
  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    const instance = this.instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.instances.length;
    return instance || null;
  }

  /**
   * Reset the counter
   */
  reset(): void {
    this.currentIndex = 0;
  }
}

/**
 * Random load balancer
 * Randomly selects an instance
 */
export class RandomBalancer {
  private instances: InstanceInfo[] = [];

  /**
   * Update the list of available instances
   */
  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  /**
   * Get a random instance
   */
  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    const index = Math.floor(Math.random() * this.instances.length);
    return this.instances[index] || null;
  }
}

/**
 * Least connections load balancer
 * Selects the instance with the fewest active connections
 */
export class LeastConnectionsBalancer {
  private instances: InstanceInfo[] = [];

  /**
   * Update the list of available instances
   */
  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  /**
   * Get the instance with least connections
   */
  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    return this.instances.reduce((min, instance) => 
      instance.connections < min.connections ? instance : min
    );
  }

  /**
   * Record a connection to an instance
   */
  recordConnection(instanceId: number): void {
    const instance = this.instances.find(i => i.id === instanceId);
    if (instance) {
      instance.connections++;
    }
  }

  /**
   * Release a connection from an instance
   */
  releaseConnection(instanceId: number): void {
    const instance = this.instances.find(i => i.id === instanceId);
    if (instance && instance.connections > 0) {
      instance.connections--;
    }
  }
}

/**
 * Least CPU load balancer
 * Selects the instance with the lowest CPU usage
 */
export class LeastCpuBalancer {
  private instances: InstanceInfo[] = [];

  /**
   * Update the list of available instances
   */
  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  /**
   * Get the instance with least CPU usage
   */
  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    return this.instances.reduce((min, instance) => 
      instance.cpu < min.cpu ? instance : min
    );
  }
}

/**
 * Least memory load balancer
 * Selects the instance with the lowest memory usage
 */
export class LeastMemoryBalancer {
  private instances: InstanceInfo[] = [];

  /**
   * Update the list of available instances
   */
  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  /**
   * Get the instance with least memory usage
   */
  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    return this.instances.reduce((min, instance) => 
      instance.memory < min.memory ? instance : min
    );
  }
}

/**
 * IP Hash load balancer
 * Consistently maps client IPs to specific instances
 */
export class IpHashBalancer {
  private instances: InstanceInfo[] = [];

  /**
   * Update the list of available instances
   */
  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  /**
   * Get instance based on client IP
   */
  getInstance(clientIp: string): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    // Calculate hash of IP
    let hash = 0;
    for (let i = 0; i < clientIp.length; i++) {
      const char = clientIp.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    const index = Math.abs(hash) % this.instances.length;
    return this.instances[index] || null;
  }
}

/**
 * Weighted load balancer
 * Distributes requests based on instance weights
 */
export class WeightedBalancer {
  private instances: InstanceInfo[] = [];
  private currentIndex = 0;
  private currentWeight = 0;

  /**
   * Update the list of available instances
   */
  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  /**
   * Get instance based on weights
   */
  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    // Find instance with highest weight ratio
    let bestInstance: InstanceInfo | null = null;
    let maxWeight = -1;

    for (let i = 0; i < this.instances.length; i++) {
      const instance = this.instances[i];
      if (instance && instance.weight > maxWeight) {
        maxWeight = instance.weight;
        bestInstance = instance;
      }
    }

    if (bestInstance) {
      // Decrement weight after selection
      bestInstance.weight = Math.max(0, bestInstance.weight - 1);
    }

    return bestInstance || null;
  }

  /**
   * Reset weights to original values
   */
  resetWeights(originalWeights: number[]): void {
    for (let i = 0; i < this.instances.length && i < originalWeights.length; i++) {
      const instance = this.instances[i];
      const weight = originalWeights[i];
      if (instance && weight !== undefined) {
        instance.weight = weight;
      }
    }
  }
}

/**
 * Factory for creating load balancer instances
 */
export class LoadBalancerFactory {
  /**
   * Create a load balancer based on strategy
   */
  static create(strategy: LoadBalanceStrategy): 
    RoundRobinBalancer | 
    RandomBalancer | 
    LeastConnectionsBalancer | 
    LeastCpuBalancer | 
    LeastMemoryBalancer | 
    IpHashBalancer | 
    WeightedBalancer {
    
    switch (strategy) {
      case LoadBalanceStrategyValues.ROUND_ROBIN:
        return new RoundRobinBalancer();
      case LoadBalanceStrategyValues.RANDOM:
        return new RandomBalancer();
      case LoadBalanceStrategyValues.LEAST_CONNECTIONS:
        return new LeastConnectionsBalancer();
      case LoadBalanceStrategyValues.LEAST_CPU:
        return new LeastCpuBalancer();
      case LoadBalanceStrategyValues.LEAST_MEMORY:
        return new LeastMemoryBalancer();
      case LoadBalanceStrategyValues.IP_HASH:
        return new IpHashBalancer();
      case LoadBalanceStrategyValues.WEIGHTED:
        return new WeightedBalancer();
      default:
        return new RoundRobinBalancer();
    }
  }

  /**
   * Get all available strategies
   */
  static getStrategies(): LoadBalanceStrategy[] {
    return Object.values(LoadBalanceStrategyValues);
  }

  /**
   * Validate if a strategy is supported
   */
  static isValidStrategy(strategy: string): boolean {
    return Object.values(LoadBalanceStrategyValues).includes(strategy as LoadBalanceStrategy);
  }
}

/**
 * Process cluster manager
 * Manages multiple instances of a process with load balancing
 */
export class ProcessCluster {
  private name: string;
  private instances: Map<number, InstanceInfo> = new Map();
  private balancer: RoundRobinBalancer | RandomBalancer | LeastConnectionsBalancer | 
                    LeastCpuBalancer | LeastMemoryBalancer | IpHashBalancer | WeightedBalancer;
  private strategy: LoadBalanceStrategy;
  private onInstanceUpdate?: (instances: InstanceInfo[]) => void;

  constructor(
    name: string, 
    strategy: LoadBalanceStrategy = LoadBalanceStrategyValues.ROUND_ROBIN,
    onUpdate?: (instances: InstanceInfo[]) => void
  ) {
    this.name = name;
    this.strategy = strategy;
    this.balancer = LoadBalancerFactory.create(strategy);
    this.onInstanceUpdate = onUpdate;
  }

  /**
   * Set the load balancing strategy
   */
  setStrategy(strategy: LoadBalanceStrategy): void {
    this.strategy = strategy;
    this.balancer = LoadBalancerFactory.create(strategy);
    this.balancer.setInstances(this.getHealthyInstances());
  }

  /**
   * Add an instance to the cluster
   */
  addInstance(id: number, config?: Partial<InstanceInfo>): void {
    const instance: InstanceInfo = {
      id,
      name: `${this.name}-${id}`,
      connections: 0,
      cpu: 0,
      memory: 0,
      weight: config?.weight ?? 1,
      healthy: true,
      ...config,
    };
    this.instances.set(id, instance);
    this.updateBalancer();
  }

  /**
   * Remove an instance from the cluster
   */
  removeInstance(id: number): void {
    this.instances.delete(id);
    this.updateBalancer();
  }

  /**
   * Update instance stats
   */
  updateInstanceStats(id: number, stats: { cpu?: number; memory?: number; healthy?: boolean }): void {
    const instance = this.instances.get(id);
    if (instance) {
      if (stats.cpu !== undefined) instance.cpu = stats.cpu;
      if (stats.memory !== undefined) instance.memory = stats.memory;
      if (stats.healthy !== undefined) instance.healthy = stats.healthy;
      this.updateBalancer();
    }
  }

  /**
   * Get all instances
   */
  getInstances(): InstanceInfo[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get healthy instances only
   */
  private getHealthyInstances(): InstanceInfo[] {
    return this.getInstances().filter(i => i.healthy);
  }

  /**
   * Update the balancer with current instances
   */
  private updateBalancer(): void {
    this.balancer.setInstances(this.getHealthyInstances());
    if (this.onInstanceUpdate) {
      this.onInstanceUpdate(this.getHealthyInstances());
    }
  }

  /**
   * Get next instance using load balancing
   */
  getNextInstance(clientIp?: string): InstanceInfo | null {
    if (this.balancer instanceof IpHashBalancer) {
      return this.balancer.getInstance(clientIp || '0.0.0.0');
    }
    return (this.balancer as any).getInstance();
  }

  /**
   * Get instance by ID
   */
  getInstance(id: number): InstanceInfo | undefined {
    return this.instances.get(id);
  }

  /**
   * Record a connection to an instance
   */
  recordConnection(id: number): void {
    if (this.balancer instanceof LeastConnectionsBalancer) {
      this.balancer.recordConnection(id);
    }
    const instance = this.instances.get(id);
    if (instance) {
      instance.connections++;
    }
  }

  /**
   * Release a connection from an instance
   */
  releaseConnection(id: number): void {
    if (this.balancer instanceof LeastConnectionsBalancer) {
      this.balancer.releaseConnection(id);
    }
    const instance = this.instances.get(id);
    if (instance && instance.connections > 0) {
      instance.connections--;
    }
  }

  /**
   * Get cluster health status
   */
  getHealthStatus(): { total: number; healthy: number; unhealthy: number } {
    const all = this.getInstances();
    const healthy = all.filter(i => i.healthy);
    return {
      total: all.length,
      healthy: healthy.length,
      unhealthy: all.length - healthy.length,
    };
  }

  /**
   * Get the current strategy
   */
  getStrategy(): LoadBalanceStrategy {
    return this.strategy;
  }

  /**
   * Get the cluster name
   */
  getName(): string {
    return this.name;
  }
}
