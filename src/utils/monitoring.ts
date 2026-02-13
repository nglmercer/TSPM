/**
 * Monitoring Service for TSPM
 * Integrates all monitoring components: stats, events, health checks, and logging
 * @module utils/monitoring
 */

import { EventEmitter, EventPriorityValues, createEvent, EventTypeValues } from './events';
import type { TSPMEvent, EventType } from './events';
import { HealthCheckManager } from './healthcheck';
import type { HealthCheckConfig, HealthCheckResult } from './healthcheck';
import { Logger, LogManager } from './logger';
import type { LogMetadata } from './logger';
import { getProcessStats } from './stats';
import type { ProcessStats } from './stats';

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  /** Enable real-time monitoring */
  enabled: boolean;
  /** Monitoring interval in milliseconds */
  interval: number;
  /** CPU threshold percentage for alerts */
  cpuThreshold: number;
  /** Memory threshold in bytes for alerts */
  memoryThreshold: number;
  /** Enable event logging */
  eventLogging: boolean;
  /** Enable health checks */
  healthChecks: boolean;
  /** Log rotation enabled */
  logRotation: boolean;
  /** Max log file size before rotation */
  maxLogSize: number;
  /** Max number of rotated log files */
  maxLogFiles: number;
}

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  interval: 5000,
  cpuThreshold: 80,
  memoryThreshold: 500 * 1024 * 1024, // 500MB
  eventLogging: true,
  healthChecks: true,
  logRotation: true,
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxLogFiles: 5,
};

/**
 * Process metrics with history
 */
export interface ProcessMetrics extends ProcessStats {
  /** Timestamp of the measurement */
  timestamp: number;
  /** Process name */
  processName: string;
  /** Instance ID */
  instanceId: number;
  /** PID */
  pid: number;
}

/**
 * Process monitoring data
 */
export interface ProcessMonitoringData {
  /** Process name */
  processName: string;
  /** Instance ID */
  instanceId: number;
  /** PID */
  pid: number;
  /** Current metrics */
  metrics: ProcessMetrics | null;
  /** Metrics history (last N measurements) */
  metricsHistory: ProcessMetrics[];
  /** Health check result */
  health: HealthCheckResult | null;
  /** Last event */
  lastEvent: TSPMEvent | null;
  /** Is being monitored */
  isMonitored: boolean;
}

/**
 * Monitoring event handlers
 */
export interface MonitoringEventHandlers {
  /** Called when metrics are updated */
  onMetricsUpdate?: (data: ProcessMonitoringData) => void;
  /** Called when CPU threshold is exceeded */
  onCpuHigh?: (processName: string, instanceId: number, cpu: number) => void;
  /** Called when memory threshold is exceeded */
  onMemoryHigh?: (processName: string, instanceId: number, memory: number) => void;
  /** Called when health status changes */
  onHealthChange?: (processName: string, instanceId: number, result: HealthCheckResult) => void;
  /** Called on any process event */
  onEvent?: (event: TSPMEvent) => void;
}

/**
 * Monitoring service options
 */
export interface MonitoringServiceOptions {
  /** Monitoring configuration */
  config?: Partial<MonitoringConfig>;
  /** Event handlers */
  handlers?: MonitoringEventHandlers;
  /** Logger instance */
  logger?: Logger;
  /** Max metrics history size */
  maxHistorySize?: number;
}

/**
 * Monitoring Service
 * Central hub for all monitoring activities
 */
export class MonitoringService {
  private config: MonitoringConfig;
  private eventEmitter: EventEmitter;
  private healthCheckManager: HealthCheckManager;
  private logger: Logger;
  private processes: Map<string, ProcessMonitoringData> = new Map();
  private monitoringInterval?: Timer;
  private isRunning = false;
  private handlers: MonitoringEventHandlers;
  private maxHistorySize: number;

  constructor(options: MonitoringServiceOptions = {}) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...options.config };
    this.logger = options.logger || new Logger({ process: 'monitoring' });
    this.handlers = options.handlers || {};
    this.maxHistorySize = options.maxHistorySize || 60; // 5 minutes at 5s intervals

    // Initialize event emitter
    this.eventEmitter = new EventEmitter({
      verbose: this.config.eventLogging,
      errorHandler: (error, event) => {
        this.logger.error(`Event handler error for ${event.type}: ${error.message}`);
      },
    });

    // Initialize health check manager
    this.healthCheckManager = new HealthCheckManager(
      {},
      (processName, instanceId, result) => {
        this.handleHealthStatusChange(processName, instanceId, result);
      }
    );

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up internal event listeners
   */
  private setupEventListeners(): void {
    // Listen for all events
    this.eventEmitter.onAny((event) => {
      if (this.handlers.onEvent) {
        this.handlers.onEvent(event);
      }

      // Update process data with last event
      if ('processName' in event.data && 'instanceId' in event.data) {
        const key = this.getProcessKey(event.data.processName as string, event.data.instanceId as number);
        const processData = this.processes.get(key);
        if (processData) {
          processData.lastEvent = event;
        }
      }
    });
  }

  /**
   * Register a process for monitoring
   */
  registerProcess(
    processName: string,
    instanceId: number,
    pid: number,
    healthCheckConfig?: Partial<HealthCheckConfig>
  ): void {
    const key = this.getProcessKey(processName, instanceId);

    if (this.processes.has(key)) {
      this.logger.warn(`Process ${key} already registered for monitoring`);
      return;
    }

    // Create monitoring data
    const data: ProcessMonitoringData = {
      processName,
      instanceId,
      pid,
      metrics: null,
      metricsHistory: [],
      health: null,
      lastEvent: null,
      isMonitored: true,
    };

    this.processes.set(key, data);

    // Register health check if enabled
    if (this.config.healthChecks && healthCheckConfig?.enabled !== false) {
      this.healthCheckManager.register(processName, instanceId, pid, healthCheckConfig);
    }

    // Emit instance add event
    this.eventEmitter.emit(createEvent(
      'instance:add' as EventType,
      'MonitoringService',
      { processName, instanceId, totalInstances: this.processes.size },
      EventPriorityValues.NORMAL
    ));

    this.logger.info(`Registered process for monitoring: ${key} (PID: ${pid})`);
  }

  /**
   * Unregister a process from monitoring
   */
  unregisterProcess(processName: string, instanceId: number): void {
    const key = this.getProcessKey(processName, instanceId);
    const data = this.processes.get(key);

    if (!data) {
      return;
    }

    // Stop health checks
    this.healthCheckManager.unregister(processName, instanceId);

    // Remove from monitoring
    this.processes.delete(key);

    // Emit instance remove event
    this.eventEmitter.emit(createEvent(
      'instance:remove' as EventType,
      'MonitoringService',
      { processName, instanceId, remainingInstances: this.processes.size },
      EventPriorityValues.NORMAL
    ));

    this.logger.info(`Unregistered process from monitoring: ${key}`);
  }

  /**
   * Update PID for a registered process
   */
  updatePid(processName: string, instanceId: number, pid: number): void {
    const key = this.getProcessKey(processName, instanceId);
    const data = this.processes.get(key);

    if (data) {
      data.pid = pid;
      this.healthCheckManager.updatePid(processName, instanceId, pid);
    }
  }

  /**
   * Start monitoring all registered processes
   */
  start(): void {
    if (this.isRunning) {
      this.logger.warn('Monitoring service is already running');
      return;
    }

    this.isRunning = true;

    // Start health checks
    if (this.config.healthChecks) {
      this.healthCheckManager.startAll();
    }

    // Start metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.interval);

    // Initial collection
    this.collectMetrics();

    // Emit system start event
    this.eventEmitter.emit(createEvent(
      'system:start' as EventType,
      'MonitoringService',
      { configFile: '', processCount: this.processes.size },
      EventPriorityValues.HIGH
    ));

    this.logger.info(`Monitoring service started (interval: ${this.config.interval}ms)`);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    // Stop health checks
    this.healthCheckManager.stopAll();

    // Emit system stop event
    this.eventEmitter.emit(createEvent(
      'system:stop' as EventType,
      'MonitoringService',
      { reason: 'manual', graceful: true },
      EventPriorityValues.HIGH
    ));

    this.logger.info('Monitoring service stopped');
  }

  /**
   * Collect metrics for all registered processes
   */
  private async collectMetrics(): Promise<void> {
    for (const [key, data] of this.processes.entries()) {
      if (!data.isMonitored) continue;

      try {
        const stats = await getProcessStats(data.pid);

        if (stats) {
          const metrics: ProcessMetrics = {
            ...stats,
            timestamp: Date.now(),
            processName: data.processName,
            instanceId: data.instanceId,
            pid: data.pid,
          };

          // Update current metrics
          data.metrics = metrics;

          // Add to history
          data.metricsHistory.push(metrics);
          if (data.metricsHistory.length > this.maxHistorySize) {
            data.metricsHistory.shift();
          }

          // Check thresholds
          this.checkThresholds(data, metrics);

          // Emit metrics update event
          this.eventEmitter.emit(createEvent(
            'metrics:update' as EventType,
            'MonitoringService',
            { processName: data.processName, instanceId: data.instanceId, metrics },
            EventPriorityValues.LOW
          ));

          // Call handler
          if (this.handlers.onMetricsUpdate) {
            this.handlers.onMetricsUpdate(data);
          }
        } else {
          // Process not found, mark as stopped
          data.metrics = null;
        }
      } catch (error) {
        this.logger.error(`Error collecting metrics for ${key}: ${error}`);
      }
    }

    // Perform log rotation if enabled
    if (this.config.logRotation) {
      this.performLogRotation();
    }
  }

  /**
   * Check CPU and memory thresholds
   */
  private checkThresholds(data: ProcessMonitoringData, metrics: ProcessMetrics): void {
    // CPU threshold
    if (metrics.cpu > this.config.cpuThreshold) {
      this.eventEmitter.emit(createEvent(
        'metrics:cpu-high' as EventType,
        'MonitoringService',
        {
          processName: data.processName,
          instanceId: data.instanceId,
          cpu: metrics.cpu,
          threshold: this.config.cpuThreshold,
        },
        EventPriorityValues.HIGH
      ));

      if (this.handlers.onCpuHigh) {
        this.handlers.onCpuHigh(data.processName, data.instanceId, metrics.cpu);
      }
    }

    // Memory threshold
    if (metrics.memory > this.config.memoryThreshold) {
      this.eventEmitter.emit(createEvent(
        'metrics:memory-high' as EventType,
        'MonitoringService',
        {
          processName: data.processName,
          instanceId: data.instanceId,
          memory: metrics.memory,
          threshold: this.config.memoryThreshold,
        },
        EventPriorityValues.HIGH
      ));

      if (this.handlers.onMemoryHigh) {
        this.handlers.onMemoryHigh(data.processName, data.instanceId, metrics.memory);
      }
    }
  }

  /**
   * Handle health status change
   */
  private handleHealthStatusChange(
    processName: string,
    instanceId: number,
    result: HealthCheckResult
  ): void {
    const key = this.getProcessKey(processName, instanceId);
    const data = this.processes.get(key);

    if (data) {
      const previousHealthy = data.health?.healthy;
      data.health = result;

      // Emit health change event if status changed
      if (previousHealthy !== result.healthy) {
        this.eventEmitter.emit(createEvent(
          'instance:health-change' as EventType,
          'MonitoringService',
          { processName, instanceId, healthy: result.healthy },
          EventPriorityValues.HIGH
        ));
      }
    }

    if (this.handlers.onHealthChange) {
      this.handlers.onHealthChange(processName, instanceId, result);
    }
  }

  /**
   * Perform log rotation for all log files
   */
  private performLogRotation(): void {
    // This is handled by the LogManager
    // Called periodically to check rotation
  }

  /**
   * Get process key for map
   */
  private getProcessKey(processName: string, instanceId: number): string {
    return `${processName}-${instanceId}`;
  }

  /**
   * Get monitoring data for a process
   */
  getProcessData(processName: string, instanceId: number): ProcessMonitoringData | undefined {
    return this.processes.get(this.getProcessKey(processName, instanceId));
  }

  /**
   * Get all monitoring data
   */
  getAllProcessData(): ProcessMonitoringData[] {
    return Array.from(this.processes.values());
  }

  /**
   * Get event emitter
   */
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  /**
   * Get health check manager
   */
  getHealthCheckManager(): HealthCheckManager {
    return this.healthCheckManager;
  }

  /**
   * Get current metrics for a process
   */
  getCurrentMetrics(processName: string, instanceId: number): ProcessMetrics | null {
    const data = this.processes.get(this.getProcessKey(processName, instanceId));
    return data?.metrics || null;
  }

  /**
   * Get metrics history for a process
   */
  getMetricsHistory(processName: string, instanceId: number): ProcessMetrics[] {
    const data = this.processes.get(this.getProcessKey(processName, instanceId));
    return data?.metricsHistory || [];
  }

  /**
   * Get health status for a process
   */
  getHealthStatus(processName: string, instanceId: number): HealthCheckResult | null {
    const data = this.processes.get(this.getProcessKey(processName, instanceId));
    return data?.health || null;
  }

  /**
   * Get overall health summary
   */
  getHealthSummary(): { healthy: number; unhealthy: number; total: number } {
    return this.healthCheckManager.getHealthStatus();
  }

  /**
   * Check if monitoring is running
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }

  /**
   * Get number of monitored processes
   */
  getMonitoredCount(): number {
    return this.processes.size;
  }

  /**
   * Emit a custom event
   */
  emitEvent(event: TSPMEvent): void {
    this.eventEmitter.emit(event);
  }

  /**
   * Subscribe to events
   */
  onEvent(type: EventType, listener: (event: TSPMEvent) => void | Promise<void>): void {
    this.eventEmitter.on(type, listener);
  }

  /**
   * Run health check for a specific process
   */
  async runHealthCheck(processName: string, instanceId: number): Promise<HealthCheckResult | null> {
    return this.healthCheckManager.check(processName, instanceId);
  }

  /**
   * Run health checks for all processes
   */
  async runAllHealthChecks(): Promise<Map<string, HealthCheckResult>> {
    return this.healthCheckManager.checkAll();
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart monitoring if interval changed
    if (config.interval && this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

/**
 * Default monitoring service instance
 */
let defaultMonitoringService: MonitoringService | null = null;

/**
 * Get the default monitoring service instance
 */
export function getMonitoringService(options?: MonitoringServiceOptions): MonitoringService {
  if (!defaultMonitoringService) {
    defaultMonitoringService = new MonitoringService(options);
  }
  return defaultMonitoringService;
}

/**
 * Create a new monitoring service instance
 */
export function createMonitoringService(options?: MonitoringServiceOptions): MonitoringService {
  return new MonitoringService(options);
}
