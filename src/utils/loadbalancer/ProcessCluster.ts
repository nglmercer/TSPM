import { LOAD_BALANCE_STRATEGY, type LoadBalanceStrategy } from '../config/constants';
import { type InstanceInfo } from './types';
import { LoadBalancerFactory } from './factory';
import { IpHashBalancer, LeastConnectionsBalancer } from './strategies';

/**
 * Process cluster manager
 * Manages multiple instances of a process with load balancing
 */
export class ProcessCluster {
  private name: string;
  private instances: Map<number, InstanceInfo> = new Map();
  private balancer: ReturnType<typeof LoadBalancerFactory.create>;
  private strategy: LoadBalanceStrategy;
  private onInstanceUpdate?: (instances: InstanceInfo[]) => void;

  constructor(
    name: string, 
    strategy: LoadBalanceStrategy = LOAD_BALANCE_STRATEGY.ROUND_ROBIN,
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
    return this.balancer.getInstance();
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
