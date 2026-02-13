import { type LoadBalanceStrategy } from '../config/constants';

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
 * Base interface for balancer strategies
 */
export interface Balancer {
  setInstances(instances: InstanceInfo[]): void;
  getInstance(clientIp?: string): InstanceInfo | null;
}
