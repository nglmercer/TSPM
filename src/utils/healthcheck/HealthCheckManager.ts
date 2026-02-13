import { DEFAULT_HEALTH_CHECK } from '../config/constants';
import { type HealthCheckConfig, type HealthCheckResult } from './types';
import { HealthCheckRunner } from './HealthCheckRunner';

/**
 * Health check manager - manages health checks for multiple processes
 */
export class HealthCheckManager {
  private checks: Map<string, HealthCheckRunner> = new Map();
  private globalConfig: Partial<HealthCheckConfig> = {};
  private onProcessStatusChange?: (processName: string, instanceId: number, result: HealthCheckResult) => void;

  constructor(
    globalConfig?: Partial<HealthCheckConfig>,
    onStatusChange?: (processName: string, instanceId: number, result: HealthCheckResult) => void
  ) {
    this.globalConfig = globalConfig || {};
    this.onProcessStatusChange = onStatusChange;
  }

  /**
   * Register a process for health checks
   */
  register(
    processName: string,
    instanceId: number,
    pid: number,
    config?: Partial<HealthCheckConfig>
  ): void {
    const key = `${processName}-${instanceId}`;
    
    // Merge global config with process-specific config
    const mergedConfig = { ...DEFAULT_HEALTH_CHECK, ...this.globalConfig, ...config };
    
    const runner = new HealthCheckRunner({
      processName,
      instanceId,
      pid,
      config: mergedConfig,
      onStatusChange: (result) => {
        if (this.onProcessStatusChange) {
          this.onProcessStatusChange(processName, instanceId, result);
        }
      },
    });
    
    this.checks.set(key, runner);
    
    // Start health check if enabled
    if (mergedConfig.enabled) {
      runner.start();
    }
  }

  /**
   * Unregister a process from health checks
   */
  unregister(processName: string, instanceId: number): void {
    const key = `${processName}-${instanceId}`;
    const runner = this.checks.get(key);
    
    if (runner) {
      runner.stop();
      this.checks.delete(key);
    }
  }

  /**
   * Update PID for a process
   */
  updatePid(processName: string, instanceId: number, pid: number): void {
    const key = `${processName}-${instanceId}`;
    const runner = this.checks.get(key);
    
    if (runner) {
      runner.updatePid(pid);
    }
  }

  /**
   * Run health check for a specific process
   */
  async check(processName: string, instanceId: number): Promise<HealthCheckResult | null> {
    const key = `${processName}-${instanceId}`;
    const runner = this.checks.get(key);
    
    if (runner) {
      return runner.runCheck();
    }
    
    return null;
  }

  /**
   * Run health check for all processes
   */
  async checkAll(): Promise<Map<string, HealthCheckResult>> {
    const results = new Map<string, HealthCheckResult>();
    
    for (const [key, runner] of this.checks.entries()) {
      const result = await runner.runCheck();
      results.set(key, result);
    }
    
    return results;
  }

  /**
   * Get health status summary
   */
  getHealthStatus(): { healthy: number; unhealthy: number; total: number } {
    let healthy = 0;
    let unhealthy = 0;
    
    for (const runner of this.checks.values()) {
      const result = runner.getLastResult();
      if (result?.healthy) {
        healthy++;
      } else {
        unhealthy++;
      }
    }
    
    return {
      healthy,
      unhealthy,
      total: this.checks.size,
    };
  }

  /**
   * Stop all health checks
   */
  stopAll(): void {
    for (const runner of this.checks.values()) {
      runner.stop();
    }
  }

  /**
   * Start all health checks
   */
  startAll(): void {
    for (const runner of this.checks.values()) {
      if (runner.getLastResult() === undefined) {
        runner.start();
      }
    }
  }

  /**
   * Get the number of registered health checks
   */
  getCount(): number {
    return this.checks.size;
  }
}
