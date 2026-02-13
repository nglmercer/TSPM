import { existsSync } from 'fs';
import { 
  HEALTH_CHECK_PROTOCOL, 
  HEALTH_STATUS, 
  DEFAULT_HEALTH_CHECK 
} from '../config/constants';
import { 
  type HealthCheckConfig, 
  type HealthCheckResult, 
  type HealthCheckOptions 
} from './types';
import { checkHttp, checkTcpPort, checkCommand } from './strategies';

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
    // Note: /proc is Linux specific, but TSPM is likely targeted at Linux
    if (!this.pid || !existsSync(`/proc/${this.pid}`)) {
      return {
        healthy: false,
        status: HEALTH_STATUS.UNHEALTHY,
        error: 'Process not running',
        timestamp,
        consecutiveFailures: this.consecutiveFailures,
      };
    }
    
    try {
      switch (this.config.protocol) {
        case HEALTH_CHECK_PROTOCOL.HTTP:
        case HEALTH_CHECK_PROTOCOL.HTTPS: {
          const protocol = this.config.protocol === HEALTH_CHECK_PROTOCOL.HTTP ? 'http' : 'https';
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
            status: result.success ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
            statusCode: result.statusCode,
            responseTime: Date.now() - startTime,
            error: result.error,
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
        }
        
        case HEALTH_CHECK_PROTOCOL.TCP: {
          const success = await checkTcpPort(
            this.config.host || 'localhost',
            this.config.port || 3000,
            this.config.timeout
          );
          
          return {
            healthy: success,
            status: success ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
            responseTime: Date.now() - startTime,
            error: success ? undefined : 'Connection failed',
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
        }
        
        case HEALTH_CHECK_PROTOCOL.COMMAND: {
          if (!this.config.command) {
            return {
              healthy: false,
              status: HEALTH_STATUS.UNKNOWN,
              error: 'No command specified',
              timestamp,
              consecutiveFailures: this.consecutiveFailures,
            };
          }
          
          const result = await checkCommand(this.config.command, this.config.timeout);
          
          return {
            healthy: result.success,
            status: result.success ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
            error: result.error,
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
        }
        
        case HEALTH_CHECK_PROTOCOL.NONE:
        default:
          return {
            healthy: true,
            status: HEALTH_STATUS.HEALTHY,
            timestamp,
            consecutiveFailures: this.consecutiveFailures,
          };
      }
    } catch (error) {
      return {
        healthy: false,
        status: HEALTH_STATUS.UNHEALTHY,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
        consecutiveFailures: this.consecutiveFailures,
      };
    }
  }

  getLastResult(): HealthCheckResult | undefined {
    return this.lastResult;
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  updatePid(pid: number): void {
    this.pid = pid;
  }

  isMaxRetriesExceeded(): boolean {
    return this.consecutiveFailures >= this.config.retries;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }
}
