import type { ProcessConfig, ProcessStatus, InstanceInfo, ClusterInfo, ProcessGroup } from "./types";
import { ManagedProcess } from "./ManagedProcess";
import { ProcessCluster, LoadBalancerFactory, type LoadBalanceStrategy } from "../utils/loadbalancer";
import { MonitoringService, createMonitoringService, type MonitoringServiceOptions } from "../utils/monitoring";
import { EventEmitter, getDefaultEmitter, EventTypeValues, EventPriorityValues, createEvent } from "../utils/events";
import type { HealthCheckConfig } from "../utils/healthcheck";
import type { TSPMEvent, EventType, EventListener } from "../utils/events";
import { 
  LOAD_BALANCE_STRATEGY, 
  PROCESS_STATE, 
  CLUSTER_CONFIG 
} from "../utils/config/constants";

import { WebhookService, type WebhookConfig } from "../utils/webhooks";
import { ProcessRegistry } from "./ProcessRegistry";
import { ClusterManager } from "./ClusterManager";
  
export class ProcessManager {
  private registry: ProcessRegistry = new ProcessRegistry();
  private clusterManager: ClusterManager = new ClusterManager();
  private monitoringService?: MonitoringService;
  private eventEmitter: EventEmitter;
  private webhookService?: WebhookService;
  
  constructor(options?: { 
    monitoring?: MonitoringServiceOptions;
    webhooks?: WebhookConfig[];
  }) {
    this.eventEmitter = getDefaultEmitter();
    if (options?.monitoring) {
      this.monitoringService = createMonitoringService(options.monitoring);
    }
    if (options?.webhooks && options.webhooks.length > 0) {
      this.webhookService = new WebhookService(options.webhooks);
      // Forward all events to webhooks
      this.eventEmitter.onAny((event) => {
        this.webhookService?.send(event);
      });
    }
  }

  /**
   * Add a new process to be managed
   * @param config Process configuration
   */
  addProcess(config: ProcessConfig): void {
    const instanceCount = config.instances || 1;
    
    // Create/get cluster
    const cluster = this.clusterManager.getOrCreateCluster(config);
    
    for (let i = 0; i < instanceCount; i++) {
        const process = new ManagedProcess(config, i, this.eventEmitter);
        const name = i > 0 ? `${config.name}-${i}` : config.name;
        this.registry.add(name, process);
        
        // Add to cluster if exists
        if (cluster) {
          cluster.addInstance(i, {
            weight: config.instanceWeight || 1,
          });
        }
    }
  }

  /**
   * Get a managed process by name
   * @param name Process name
   * @returns ManagedProcess or undefined if not found
   */
  getProcess(name: string): ManagedProcess | undefined {
    return this.registry.get(name);
  }

  /**
   * Get all processes for a base process name (including instances)
   * @param baseName Base process name
   * @returns Array of managed processes
   */
  getProcessesByBaseName(baseName: string): ManagedProcess[] {
    return this.registry.getAll().filter(
      p => p.getConfig().name === baseName
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
    return this.registry.get(name);
  }

  /**
   * Remove a process from management
   * @param name Process name or base name (to remove all instances)
   */
  removeProcess(name: string): void {
    const process = this.registry.get(name);
    if (process) {
      const config = process.getConfig();
      process.stop();
      this.registry.delete(name);
      
      // Remove from cluster
      const cluster = this.clusterManager.getCluster(config.name);
      if (cluster) {
        const instanceId = process.getInstanceId();
        cluster.removeInstance(instanceId);
        if (cluster.getInstances().length === 0) {
          this.clusterManager.removeCluster(config.name);
        }
      }
    } else {
      // Check if it's a base name for multiple instances
      for (const proc of this.registry.getAll()) {
        const config = proc.getConfig();
        if (config.name === name) {
          const procName = proc.getInstanceId() > 0 ? `${config.name}-${proc.getInstanceId()}` : config.name;
          proc.stop();
          this.registry.delete(procName);
          
          // Remove from cluster
          const cluster = this.clusterManager.getCluster(config.name);
          if (cluster) {
            cluster.removeInstance(proc.getInstanceId());
            if (cluster.getInstances().length === 0) {
              this.clusterManager.removeCluster(config.name);
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
    return this.registry.getByNamespace(namespace);
  }

  /**
   * Remove all processes in a namespace
   * @param namespace Namespace to remove
   */
  removeByNamespace(namespace: string): void {
    const procs = this.getProcessesByNamespace(namespace);
    for (const proc of procs) {
      const config = proc.getConfig();
      const name = proc.getInstanceId() > 0 ? `${config.name}-${proc.getInstanceId()}` : config.name;
      proc.stop();
      this.registry.delete(name);
    }
  }

  /**
   * Get all processes in a specific cluster group
   * @param group Cluster group name
   */
  getProcessesByClusterGroup(group: string): ManagedProcess[] {
    return this.registry.getByClusterGroup(group);
  }

  /**
   * Get cluster information for a process
   * @param baseName Base process name
   */
  getClusterInfo(baseName: string): ClusterInfo | null {
    const cluster = this.clusterManager.getCluster(baseName);
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
        state: status.state || PROCESS_STATE.STOPPED,
        pid: status.pid,
        startedAt: status.uptime ? Date.now() - status.uptime : undefined,
      });
    }
    
    return {
      name: baseName,
      totalInstances: instances.length,
      runningInstances: instances.filter(i => i.state === PROCESS_STATE.RUNNING).length,
      healthyInstances: instances.filter(i => i.healthy).length,
      strategy: cluster.getStrategy(),
      instances,
    };
  }

  /**
   * Get all clusters
   */
  getClusters(): Map<string, ProcessCluster> {
    return this.clusterManager.getAllClusters();
  }

  /**
   * Get cluster by name
   */
  getCluster(name: string): ProcessCluster | undefined {
    return this.clusterManager.getCluster(name);
  }

  /**
   * Get all namespaces
   */
  getNamespaces(): string[] {
    return this.registry.getNamespaces();
  }

  /**
   * Get all cluster groups
   */
  getClusterGroups(): string[] {
    return this.registry.getClusterGroups();
  }

  /**
   * Get process groups
   */
  getProcessGroups(): ProcessGroup[] {
    return this.registry.getProcessGroups();
  }

  /**
   * Get next instance using load balancing
   * @param baseName Base process name
   */
  getNextInstance(baseName: string): InstanceInfo | null {
    const cluster = this.clusterManager.getCluster(baseName);
    return cluster ? cluster.getNextInstance() : null;
  }

  /**
   * Start all managed processes
   */
  async startAll(): Promise<void> {
    for (const process of this.registry.values()) {
      await process.start();
    }
  }

  /**
   * Stop all managed processes
   */
  stopAll(): void {
    for (const process of this.registry.values()) {
      process.stop();
    }
  }

  /**
   * Start a process by name or base name
   */
  async startProcess(name: string): Promise<void> {
    const processes = this.getProcessesByBaseName(name);
    if (processes.length === 0) {
      const p = this.registry.get(name);
      if (p) processes.push(p);
    }
    
    for (const proc of processes) {
      await proc.start();
    }
  }

  /**
   * Stop a process by name or base name
   */
  stopProcess(name: string): void {
    const processes = this.getProcessesByBaseName(name);
    if (processes.length === 0) {
      const p = this.registry.get(name);
      if (p) processes.push(p);
    }
    
    for (const proc of processes) {
      proc.stop();
    }
  }

  /**
   * Restart a process by name or base name
   */
  async restartProcess(name: string): Promise<void> {
    const processes = this.getProcessesByBaseName(name);
    if (processes.length === 0) {
      const p = this.registry.get(name);
      if (p) processes.push(p);
    }
    
    for (const proc of processes) {
      await proc.restart();
    }
  }

  /**
   * Get status of all managed processes
   * @returns Array of process statuses
   */
  getStatuses(): (ProcessStatus & { namespace?: string; clusterGroup?: string })[] {
    const statuses: (ProcessStatus & { namespace?: string; clusterGroup?: string })[] = [];
    for (const proc of this.registry.values()) {
      const status = proc.getStatus();
      statuses.push({
        ...status,
        namespace: proc.getConfig().namespace,
        clusterGroup: proc.getConfig().clusterGroup,
      });
    }
    return statuses;
  }

  /**
   * Get the number of managed processes
   */
  get processCount(): number {
    return this.registry.size;
  }

  /**
   * Get the number of clusters
   */
  get clusterCount(): number {
    return this.clusterManager.size;
  }

  /**
   * Check if a process exists
   * @param name Process name or base name
   */
  hasProcess(name: string): boolean {
    if (this.registry.has(name)) return true;
    
    for (const proc of this.registry.getAll()) {
      if (proc.getConfig().name === name) return true;
    }
    
    return false;
  }

  /**
   * Check if a process is clustered
   * @param baseName Base process name
   */
  isClustered(baseName: string): boolean {
    return !!this.clusterManager.getCluster(baseName);
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
        const process = new ManagedProcess(config, i, this.eventEmitter);
        const name = `${baseName}-${i}`;
        this.registry.add(name, process);
        
        const cluster = this.clusterManager.getCluster(baseName);
        if (cluster) {
          cluster.addInstance(i, { weight: config.instanceWeight || 1 });
        }
        
        await process.start();
      }
    } else if (newCount < currentCount) {
      // Remove instances
      for (let i = currentCount - 1; i >= newCount; i--) {
        const name = `${baseName}-${i}`;
        const process = this.registry.get(name);
        if (process) {
          process.stop();
          this.registry.delete(name);
          
          const cluster = this.clusterManager.getCluster(baseName);
          if (cluster) {
            cluster.removeInstance(i);
          }
        }
      }
    }
  }
  
  /**
   * Get the event emitter
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }
  
  /**
   * Get the monitoring service
   */
  getMonitoringService(): MonitoringService | undefined {
    return this.monitoringService;
  }
  
  /**
   * Start monitoring all processes
   */
  startMonitoring(): void {
    if (!this.monitoringService) {
      this.monitoringService = createMonitoringService();
    }
    
    // Register all processes with monitoring
    for (const proc of this.registry.getAll()) {
      const status = proc.getStatus();
      if (status.pid) {
        const config = proc.getConfig();
        this.monitoringService.registerProcess(
          config.name,
          proc.getInstanceId(),
          status.pid,
          config.healthCheck as Partial<HealthCheckConfig> | undefined
        );
      }
    }
    
    this.monitoringService.start();
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringService) {
      this.monitoringService.stop();
    }
  }
  
  /**
   * Subscribe to process events
   */
  onProcessEvent(
    eventType: EventType,
    listener: EventListener
  ): void {
    this.eventEmitter.on(eventType, listener);
  }
}
