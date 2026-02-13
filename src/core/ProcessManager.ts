import type { ProcessConfig, ProcessStatus, InstanceInfo, ClusterInfo, ProcessGroup } from "./types";
import { ManagedProcess } from "./ManagedProcess";
import { ProcessCluster, LoadBalancerFactory, type LoadBalanceStrategy } from "../utils/loadbalancer";
import { MonitoringService, createMonitoringService, type MonitoringServiceOptions } from "../utils/monitoring";
import { EventEmitter, getDefaultEmitter, EventTypeValues, EventPriorityValues, createEvent } from "../utils/events";
import type { HealthCheckConfig } from "../utils/healthcheck";

export class ProcessManager {
  private processes: Map<string, ManagedProcess> = new Map();
  private clusters: Map<string, ProcessCluster> = new Map();
  private namespaces: Map<string, Set<string>> = new Map();
  private clusterGroups: Map<string, Set<string>> = new Map();
  private monitoringService?: MonitoringService;
  private eventEmitter: EventEmitter;
  
  constructor(options?: { monitoring?: MonitoringServiceOptions }) {
    this.eventEmitter = getDefaultEmitter();
    if (options?.monitoring) {
      this.monitoringService = createMonitoringService(options.monitoring);
    }
  }

  /**
   * Add a new process to be managed
   * @param config Process configuration
   */
  addProcess(config: ProcessConfig): void {
    const instanceCount = config.instances || 1;
    
    // Create cluster for this process if instances > 1
    if (instanceCount > 1) {
      const cluster = new ProcessCluster(
        config.name,
        (config.lbStrategy as LoadBalanceStrategy) || 'round-robin'
      );
      this.clusters.set(config.name, cluster);
    }
    
    for (let i = 0; i < instanceCount; i++) {
        const process = new ManagedProcess(config, i);
        const name = i > 0 ? `${config.name}-${i}` : config.name;
        this.processes.set(name, process);
        
        // Add to cluster if exists
        const cluster = this.clusters.get(config.name);
        if (cluster) {
          cluster.addInstance(i, {
            weight: config.instanceWeight || 1,
          });
        }
        
        // Track namespace
        if (config.namespace) {
          if (!this.namespaces.has(config.namespace)) {
            this.namespaces.set(config.namespace, new Set());
          }
          this.namespaces.get(config.namespace)!.add(name);
        }
        
        // Track cluster group
        if (config.clusterGroup) {
          if (!this.clusterGroups.has(config.clusterGroup)) {
            this.clusterGroups.set(config.clusterGroup, new Set());
          }
          this.clusterGroups.get(config.clusterGroup)!.add(name);
        }
    }
  }

  /**
   * Get a managed process by name
   * @param name Process name
   * @returns ManagedProcess or undefined if not found
   */
  getProcess(name: string): ManagedProcess | undefined {
    return this.processes.get(name);
  }

  /**
   * Get all processes for a base process name (including instances)
   * @param baseName Base process name
   * @returns Array of managed processes
   */
  getProcessesByBaseName(baseName: string): ManagedProcess[] {
    return Array.from(this.processes.values()).filter(
      p => {
        const config = p.getConfig();
        const instanceId = p.getInstanceId();
        if (instanceId === 0) {
          return config.name === baseName;
        }
        return config.name === baseName;
      }
    );
  }

  /**
   * Get process by instance ID
   * @param baseName Base process name
   * @param instanceId Instance ID
   * @returns ManagedProcess or undefined
   */
  getProcessByInstance(baseName: string, instanceId: number): ManagedProcess | undefined {
    const name = instanceId > 0 ? `${baseName}-${instanceId}` : baseName;
    return this.processes.get(name);
  }

  /**
   * Remove a process from management
   * @param name Process name or base name (to remove all instances)
   */
  removeProcess(name: string): void {
    const process = this.processes.get(name);
    if (process) {
      const config = process.getConfig();
      process.stop();
      this.processes.delete(name);
      
      // Remove from cluster
      const cluster = this.clusters.get(config.name);
      if (cluster) {
        const instanceId = process.getInstanceId();
        cluster.removeInstance(instanceId);
        if (cluster.getInstances().length === 0) {
          this.clusters.delete(config.name);
        }
      }
    } else {
      // Check if it's a base name for multiple instances
      for (const [procName, proc] of this.processes.entries()) {
        if (procName === name || procName.startsWith(`${name}-`)) {
          const config = proc.getConfig();
          proc.stop();
          this.processes.delete(procName);
          
          // Remove from cluster
          const cluster = this.clusters.get(config.name);
          if (cluster) {
            const instanceId = proc.getInstanceId();
            cluster.removeInstance(instanceId);
            if (cluster.getInstances().length === 0) {
              this.clusters.delete(config.name);
            }
          }
        }
      }
    }
  }

  /**
   * Get all processes in a specific namespace
   * @param namespace Namespace to filter by
   */
  getProcessesByNamespace(namespace: string): ManagedProcess[] {
    const namesInNamespace = this.namespaces.get(namespace);
    if (!namesInNamespace) return [];
    
    return Array.from(namesInNamespace).map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
  }

  /**
   * Remove all processes in a namespace
   * @param namespace Namespace to remove
   */
  removeByNamespace(namespace: string): void {
    const procs = this.getProcessesByNamespace(namespace);
    for (const proc of procs) {
        // Find the key in the map to delete it
        for (const [key, p] of this.processes.entries()) {
            if (p === proc) {
                proc.stop();
                this.processes.delete(key);
                break;
            }
        }
    }
    this.namespaces.delete(namespace);
  }

  /**
   * Get all processes in a specific cluster group
   * @param group Cluster group name
   */
  getProcessesByClusterGroup(group: string): ManagedProcess[] {
    const namesInGroup = this.clusterGroups.get(group);
    if (!namesInGroup) return [];
    
    return Array.from(namesInGroup).map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
  }

  /**
   * Get cluster information for a process
   * @param baseName Base process name
   */
  getClusterInfo(baseName: string): ClusterInfo | null {
    const cluster = this.clusters.get(baseName);
    if (!cluster) return null;
    
    const instances: InstanceInfo[] = [];
    const processes = this.getProcessesByBaseName(baseName);
    
    for (const proc of processes) {
      const status = proc.getStatus();
      const stats = proc.getLastStats();
      instances.push({
        id: proc.getInstanceId(),
        name: proc.getConfig().name,
        connections: 0,
        cpu: stats?.cpu || 0,
        memory: stats?.memory || 0,
        weight: proc.getConfig().instanceWeight || 1,
        healthy: true,
        state: status.state || 'stopped',
        pid: status.pid,
        startedAt: status.uptime ? Date.now() - status.uptime : undefined,
      });
    }
    
    return {
      name: baseName,
      totalInstances: instances.length,
      runningInstances: instances.filter(i => i.state === 'running').length,
      healthyInstances: instances.filter(i => i.healthy).length,
      strategy: cluster.getStrategy(),
      instances,
    };
  }

  /**
   * Get all clusters
   */
  getClusters(): Map<string, ProcessCluster> {
    return this.clusters;
  }

  /**
   * Get cluster by name
   */
  getCluster(name: string): ProcessCluster | undefined {
    return this.clusters.get(name);
  }

  /**
   * Get all namespaces
   */
  getNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  /**
   * Get all cluster groups
   */
  getClusterGroups(): string[] {
    return Array.from(this.clusterGroups.keys());
  }

  /**
   * Get process groups
   */
  getProcessGroups(): ProcessGroup[] {
    const groups: ProcessGroup[] = [];
    
    // Group by namespace
    for (const [namespace, processNames] of this.namespaces.entries()) {
      const processNamesArray = Array.from(processNames);
      const processes = processNamesArray.map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
      
      groups.push({
        name: namespace,
        namespace,
        processCount: new Set(processes.map(p => p.getConfig().name)).size,
        totalInstances: processes.length,
        processNames: processNamesArray,
      });
    }
    
    // Group by cluster group
    for (const [groupName, processNames] of this.clusterGroups.entries()) {
      const existingGroup = groups.find(g => g.name === groupName);
      if (!existingGroup) {
        const processNamesArray = Array.from(processNames);
        const processes = processNamesArray.map(name => this.processes.get(name)).filter(Boolean) as ManagedProcess[];
        
        groups.push({
          name: groupName,
          namespace: 'default',
          processCount: new Set(processes.map(p => p.getConfig().name)).size,
          totalInstances: processes.length,
          processNames: processNamesArray,
        });
      }
    }
    
    return groups;
  }

  /**
   * Get next instance using load balancing
   * @param baseName Base process name
   */
  getNextInstance(baseName: string): InstanceInfo | null {
    const cluster = this.clusters.get(baseName);
    return cluster ? cluster.getNextInstance() : null;
  }

  /**
   * Start all managed processes
   */
  async startAll(): Promise<void> {
    for (const process of this.processes.values()) {
      await process.start();
    }
  }

  /**
   * Stop all managed processes
   */
  stopAll(): void {
    for (const process of this.processes.values()) {
      process.stop();
    }
  }

  /**
   * Get status of all managed processes
   * @returns Array of process statuses
   */
  getStatuses(): (ProcessStatus & { namespace?: string; clusterGroup?: string })[] {
    return Array.from(this.processes.values()).map(p => ({
        ...p.getStatus(),
        namespace: p.getConfig().namespace,
        clusterGroup: p.getConfig().clusterGroup,
    }));
  }

  /**
   * Get the number of managed processes
   */
  get processCount(): number {
    return this.processes.size;
  }

  /**
   * Get the number of clusters
   */
  get clusterCount(): number {
    return this.clusters.size;
  }

  /**
   * Check if a process exists
   * @param name Process name or base name
   */
  hasProcess(name: string): boolean {
    if (this.processes.has(name)) return true;
    
    for (const procName of this.processes.keys()) {
      if (procName.startsWith(`${name}-`)) return true;
    }
    
    return false;
  }

  /**
   * Check if a process is clustered
   * @param baseName Base process name
   */
  isClustered(baseName: string): boolean {
    return this.clusters.has(baseName);
  }

  /**
   * Scale instances for a process
   * @param baseName Base process name
   * @param newCount New instance count
   */
  async scaleProcess(baseName: string, newCount: number): Promise<void> {
    const currentProcesses = this.getProcessesByBaseName(baseName);
    const currentCount = currentProcesses.length;
    
    if (newCount > currentCount) {
      // Add more instances
      const config = currentProcesses[0]?.getConfig();
      if (!config) return;
      
      for (let i = currentCount; i < newCount; i++) {
        const process = new ManagedProcess(config, i);
        const name = `${baseName}-${i}`;
        this.processes.set(name, process);
        
        const cluster = this.clusters.get(baseName);
        if (cluster) {
          cluster.addInstance(i, { weight: config.instanceWeight || 1 });
        }
        
        await process.start();
      }
    } else if (newCount < currentCount) {
      // Remove instances
      for (let i = currentCount - 1; i >= newCount; i--) {
        const name = `${baseName}-${i}`;
        const process = this.processes.get(name);
        if (process) {
          process.stop();
          this.processes.delete(name);
          
          const cluster = this.clusters.get(baseName);
          if (cluster) {
            cluster.removeInstance(i);
          }
        }
      }
    }
  }
}
