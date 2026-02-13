import { 
  HEALTH_CHECK_PROTOCOL, 
  HEALTH_STATUS,
  HTTP_METHODS,
  type HealthCheckProtocol,
  type HealthStatus,
  type HttpMethod
} from '../config/constants';

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
  method?: HttpMethod;
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
