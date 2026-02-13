import { 
  DEFAULT_HEALTH_CHECK, 
  HEALTH_CHECK_PROTOCOL, 
  HEALTH_STATUS,
  type HealthCheckProtocol,
  type HealthStatus
} from '../config/constants';
export type { HealthCheckProtocol, HealthStatus };
import { type HealthCheckConfig } from './types';

export * from './types';
export * from './strategies';
export * from './HealthCheckRunner';
export * from './HealthCheckManager';

// Re-export constants for backward compatibility
export { 
  HEALTH_CHECK_PROTOCOL as HealthCheckProtocolValues,
  HEALTH_STATUS as HealthStatusValues,
  DEFAULT_HEALTH_CHECK
} from '../config/constants';

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
      protocol: parsed.protocol === 'https:' ? HEALTH_CHECK_PROTOCOL.HTTPS : HEALTH_CHECK_PROTOCOL.HTTP,
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname || '/',
    };
  } catch {
    return {};
  }
}
