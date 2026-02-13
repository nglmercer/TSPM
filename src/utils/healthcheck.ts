/**
 * Health Check System for TSPM
 * Provides health checks and readiness/liveness probes for managed processes
 * @module utils/healthcheck
 */

import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Health check protocol types
 */
export const HealthCheckProtocolValues = {
  HTTP: 'http',
  HTTPS: 'https',
  TCP: 'tcp',
  COMMAND: 'command',
  NONE: 'none',
} as const;

export type HealthCheckProtocol = typeof HealthCheckProtocolValues[keyof typeof HealthCheckProtocolValues];

/**
 * Health check status
 */
export const HealthStatusValues = {
  HEALTHY: 'healthy',
  UNHEALTHY: 'unhealthy',
  STARTING: 'starting',
  STOPPING: 'stopping',
  UNKNOWN: 'unknown',
} as const;

export type HealthStatus = typeof HealthStatusValues[keyof typeof HealthStatusValues];

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Enable health checks */
  enabled: boolean;
  /** Health check protocol */
  protocol: HealthCheckProtocol;
  /** Health check URL or path */
  url?: string;
  /** Health check host */
  host?: string;
  /** Health check port */
  port?: number;
  /** Health check path (for HTTP) */
  path?: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT';
  /** Health check timeout in ms */
  timeout: number;
  /** Interval between health checks in ms */
  interval: number;
  /** Number of consecutive failures before marking unhealthy */
  retries: number;
  /** Initial delay before starting health checks in ms */
  initialDelay: number;
  /** Command to execute for command-based checks */
  command?: string;
  /** HTTP headers for health check */
  headers?: Record<string, string>;
  /** Expected status code for HTTP checks */
  expectedStatus?: number;
  /** Response body to match */
  responseBody?: string;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Whether the process is healthy */
  healthy: boolean;
  /** Current status */
  status: HealthStatus;
  /** Response time in ms */
  responseTime?: number;
  /** Status code (for HTTP checks) */
  statusCode?: number;
  /** Error message if unhealthy */
  error?: string;
  /** Timestamp of the check */
  timestamp: number;
  /** Number of consecutive failures */
  consecutiveFailures: number;
}

/**
 * Health check options
 */
export interface HealthCheckOptions {
  /** Process name */
  processName: string;
  /** Instance ID */
  instanceId: number;
  /** PID of the process */
  pid?: number;
  /** Health check configuration */
  config: HealthCheckConfig;
  /** Callback when health status changes */
  onStatusChange?: (result: HealthCheckResult) => void;
}

/**
 * Default health check configuration
 */
export const DEFAULT_HEALTH_CHECK: HealthCheckConfig = {
  enabled: false,
  protocol: HealthCheckProtocolValues.NONE,
  timeout: 5000,
  interval: 30000,
  retries: 3,
  initialDelay: 5000,
};

/**
 * TCP port checker
 */
async function checkTcpPort(host: string, port: number, timeout: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Simple TCP check using Bun's built-in TCP capability
    const conn = new Bun.Socket({
      hostname: host,
      port,
      protocol: 'tcp',
    } as any);
    
    let resolved = false;
    
    conn.onopen = () => {
      resolved = true;
      conn.close();
      resolve(true);
    };
    
    conn.onerror = () => {
      if (!resolved) {
        resolved = true;
        conn.close();
        resolve(false);
      }
    };
    
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        conn.close();
        resolve(false);
      }
    }, timeout);
  });
}

/**
 * HTTP/HTTPS health checker
 */
async function checkHttp(
  protocol: 'http' | 'https',
  host: string,
  port: number,
  path: string,
  method: 'GET' | 'POST' | 'PUT',
  headers: Record<string, string> = {},
  timeout: number,
  expectedStatus?: number,
  responseBody?: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const startTime = Date.now();
  const url = `${protocol}://${host}:${port}${path}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    });
    
    const responseTime = Date.now() - startTime;
    
    // Check status code
    if (expectedStatus && response.status !== expectedStatus) {
      return {
        success: false,
        statusCode: response.status,
        error: `Expected status ${expectedStatus}, got ${response.status}`,
      };
    }
    
    // Check response body if specified
    if (responseBody) {
      const body = await response.text();
      if (!body.includes(responseBody)) {
        return {
          success: false,
          statusCode: response.status,
          error: `Response body does not contain: ${responseBody}`,
        };
      }
    }
    
    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Command-based health checker
 */
async function checkCommand(command: string, timeout: number): Promise<{ success: boolean; error?: string }> {
  const result = await Bun.spawn({
    cmd: ['sh', '-c', command],
  }).exited;
  
  if (result === 0) {
    return { success: true };
  }
  
  return { success: false, error: `Command exited with code ${result}` };
}

/**
 * Health check runner class
 */
export class HealthCheckRunner {
  private processName: string;
  private instanceId: number;
  private pid?: number;
  private config: HealthCheckConfig;
  private onStatusChange?: (result: HealthCheckResult) => void;
  private timer?: Timer;
  private consecutiveFailures = 0;
  private lastResult?: HealthCheckResult;
  private isRunning = false;

  constructor(options: HealthCheckOptions) {
    this.processName = options.processName;
    this.instanceId = options.instanceId;
    this.pid = options.pid;
    this.config = { ...DEFAULT_HEALTH_CHECK, ...options.config };
    this.onStatusChange = options.onStatusChange;
  }

  /**
   * Start health checks
   */
  start(): void {
    if (this.isRunning || !this.config.enabled) return;
    
    this.isRunning = true;
    
    // Initial delay before first check
    setTimeout(() => {
      this.runCheck();
      this.startInterval();
    }, this.config.initialDelay);
  }

  /**
   * Start the interval timer
   */
  private startInterval(): void {
    this.timer = setInterval(() => {
      this.runCheck();
    }, this.config.interval);
  }

  /**
   * Stop health checks
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Run a single health check
   */
  async runCheck(): Promise<HealthCheckResult> {
    const result = await this.performCheck();
    this.lastResult = result;
    
    // Update consecutive failures
    if (result.healthy) {
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }
    
    // Notify status change
    if (this.onStatusChange) {
      this.onStatusChange(result);
    }
    
    return result;
  }

  /**
   * Perform the actual health check based on protocol
   */
  private async performCheck(): Promise<HealthCheckResult> {
    const timestamp = Date.now();
    const startTime = Date.now();
    
    // Check if process is running
    if (!this.pid || !existsSync(`/proc/${this.pid}`)) {
      return {
        healthy: false,
        status: HealthStatusValues.UNHEALTHY,
        error: 'Process not running',
        timestamp,
        consecutiveFailures: this.consecutiveFailures,
      };
    }
    
    try {
      switch (this.config.protocol) {
        case HealthCheckProtocolValues.HTTP:
        case HealthCheckProtocolValues.HTTPS: {
          const protocol = this.config.protocol === HealthCheckProtocolValues.HTTP ? 'http' : 'https';
          const result = await checkHttp(
            protocol,
            this.config.host || 'localhost',
            this.config.port || 3000,
            this.config.path || '/health',
            this.config.method || 'GET',
            this.config.headers || {},
            this.config.timeout,
            this.config.expectedStatus,
            this.config.responseBody
          );
          
          return {
            healthy: result.success,
            status: result.success ? HealthStatusValues.HEALTHY : HealthStatusValues.UNHEALTHY,
            statusCode: result.statusCode,
            responseTime: Date.now() - startTime,
            error: result.error,
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
        }
        
        case HealthCheckProtocolValues.TCP: {
          const success = await checkTcpPort(
            this.config.host || 'localhost',
            this.config.port || 3000,
            this.config.timeout
          );
          
          return {
            healthy: success,
            status: success ? HealthStatusValues.HEALTHY : HealthStatusValues.UNHEALTHY,
            responseTime: Date.now() - startTime,
            error: success ? undefined : 'Connection failed',
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
        }
        
        case HealthCheckProtocolValues.COMMAND: {
          if (!this.config.command) {
            return {
              healthy: false,
              status: HealthStatusValues.UNKNOWN,
              error: 'No command specified',
              timestamp,
              consecutiveFailures: this.consecutiveFailures,
            };
          }
          
          const result = await checkCommand(this.config.command, this.config.timeout);
          
          return {
            healthy: result.success,
            status: result.success ? HealthStatusValues.HEALTHY : HealthStatusValues.UNHEALTHY,
            error: result.error,
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
        }
        
        case HealthCheckProtocolValues.NONE:
        default:
          // No health check, always healthy
          return {
            healthy: true,
            status: HealthStatusValues.HEALTHY,
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
      }
    } catch (error) {
      return {
        healthy: false,
        status: HealthStatusValues.UNHEALTHY,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
        consecutiveFailures: this.consecutiveFailures,
      };
    }
  }

  /**
   * Get the last health check result
   */
  getLastResult(): HealthCheckResult | undefined {
    return this.lastResult;
  }

  /**
   * Get current consecutive failure count
   */
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  /**
   * Update the PID
   */
  updatePid(pid: number): void {
    this.pid = pid;
  }

  /**
   * Check if max retries exceeded
   */
  isMaxRetriesExceeded(): boolean {
    return this.consecutiveFailures >= this.config.retries;
  }

  /**
   * Check if health check is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

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
   * Get health status for all processes
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

/**
 * Create a health check configuration
 */
export function createHealthCheckConfig(config: Partial<HealthCheckConfig>): HealthCheckConfig {
  return { ...DEFAULT_HEALTH_CHECK, ...config };
}

/**
 * Parse health check URL into config
 */
export function parseHealthCheckUrl(url: string): Partial<HealthCheckConfig> {
  try {
    const parsed = new URL(url);
    
    return {
      protocol: parsed.protocol === 'https:' ? 'https' : 'http',
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname || '/',
    };
  } catch {
    return {};
  }
}
