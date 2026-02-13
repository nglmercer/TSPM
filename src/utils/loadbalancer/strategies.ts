import { type InstanceInfo, type Balancer } from './types';

/**
 * Round-robin load balancer
 */
export class RoundRobinBalancer implements Balancer {
  private currentIndex = 0;
  private instances: InstanceInfo[] = [];

  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    const instance = this.instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.instances.length;
    return instance || null;
  }

  reset(): void {
    this.currentIndex = 0;
  }
}

/**
 * Random load balancer
 */
export class RandomBalancer implements Balancer {
  private instances: InstanceInfo[] = [];

  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    const index = Math.floor(Math.random() * this.instances.length);
    return this.instances[index] || null;
  }
}

/**
 * Least connections load balancer
 */
export class LeastConnectionsBalancer implements Balancer {
  private instances: InstanceInfo[] = [];

  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    return this.instances.reduce((min, instance) => 
      instance.connections < min.connections ? instance : min
    );
  }

  recordConnection(instanceId: number): void {
    const instance = this.instances.find(i => i.id === instanceId);
    if (instance) {
      instance.connections++;
    }
  }

  releaseConnection(instanceId: number): void {
    const instance = this.instances.find(i => i.id === instanceId);
    if (instance && instance.connections > 0) {
      instance.connections--;
    }
  }
}

/**
 * Least CPU load balancer
 */
export class LeastCpuBalancer implements Balancer {
  private instances: InstanceInfo[] = [];

  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    return this.instances.reduce((min, instance) => 
      instance.cpu < min.cpu ? instance : min
    );
  }
}

/**
 * Least memory load balancer
 */
export class LeastMemoryBalancer implements Balancer {
  private instances: InstanceInfo[] = [];

  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

  getInstance(): InstanceInfo | null {
    if (this.instances.length === 0) return null;
    
    return this.instances.reduce((min, instance) => 
      instance.memory < min.memory ? instance : min
    );
  }
}

/**
 * IP Hash load balancer
 */
export class IpHashBalancer implements Balancer {
  private instances: InstanceInfo[] = [];

  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

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
 */
export class WeightedBalancer implements Balancer {
  private instances: InstanceInfo[] = [];

  setInstances(instances: InstanceInfo[]): void {
    this.instances = instances.filter(i => i.healthy);
  }

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
      // Decrement weight after selection (simple adaptive weight)
      bestInstance.weight = Math.max(0, bestInstance.weight - 1);
    }

    return bestInstance || null;
  }

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
