/**
 * TSPM - TypeScript Process Manager
 * 
 * A modern, feature-rich process manager for Node.js and Bun applications.
 * TSPM is a PM2 alternative written entirely in TypeScript.
 * 
 * @module tspm
 */

// Re-export everything from core
// Note: We export core first, then selectively export utils to avoid conflicts
export * from './src/core';

// Re-export utilities (selective to avoid PROCESS_STATE conflict)
export {
  APP,
  DEFAULT_HOST,
  DEFAULT_PORT,
  API,
  API_MESSAGES,
  API_ENDPOINTS,
  HTTP_METHODS,
  HTTP_STATUS,
  HTTP_CONTENT_TYPE,
  HTTP_HEADERS,
  CONSOLE_PREFIX,
  LOG_MESSAGES,
  EVENT_TYPES,
  RESTART_REASON,
  STOP_REASON,
  MONITORING_INTERVAL,
  THRESHOLDS,
  DEFAULT_PATHS,
  FILE_EXTENSIONS,
  createMessageFormatter,
} from './src/utils/constants';

// Event system
export {
  EventEmitter,
  EventTypeValues,
  EventPriorityValues,
  createEvent,
  getDefaultEmitter,
  createEventEmitter,
  EventSubscription,
  subscribe,
} from './src/utils/events';

export type {
  EventType,
  EventPriority,
  BaseEvent,
  ProcessStartEvent,
  ProcessStopEvent,
  ProcessRestartEvent,
  ProcessExitEvent,
  ProcessErrorEvent,
  ProcessStateChangeEvent,
  InstanceAddEvent,
  InstanceRemoveEvent,
  InstanceHealthChangeEvent,
  MetricsUpdateEvent,
  CpuHighEvent,
  MemoryHighEvent,
  SystemStartEvent,
  SystemStopEvent,
  SystemErrorEvent,
  ConfigReloadEvent,
  TSPMEvent,
  EventListener,
  EventListenerEntry,
  EventEmitterOptions,
  SystemEventType,
  ConfigEventType,
  MetricsEventType,
} from './src/utils/events';

// Health check system
export {
  HealthCheckManager,
  HealthCheckRunner,
  HealthCheckProtocolValues,
  HealthStatusValues,
  DEFAULT_HEALTH_CHECK,
  createHealthCheckConfig,
  parseHealthCheckUrl,
} from './src/utils/healthcheck';

export type {
  HealthCheckConfig,
  HealthCheckResult,
  HealthCheckOptions,
  HealthCheckProtocol,
  HealthStatus,
} from './src/utils/healthcheck';

// Logger
export {
  Logger,
  LogManager,
  LogLevelValues,
  getLogger,
  createLogger,
  log,
} from './src/utils/logger';

export type {
  LogLevel,
  LogMetadata,
  LogEntry,
  LoggerOptions,
} from './src/utils/logger';

// Stats
export {
  getProcessStats,
} from './src/utils/stats';

export type {
  ProcessStats,
} from './src/utils/stats';

// Monitoring service
export {
  MonitoringService,
  DEFAULT_MONITORING_CONFIG,
  getMonitoringService,
  createMonitoringService,
} from './src/utils/monitoring';

export type {
  MonitoringConfig,
  ProcessMetrics,
  ProcessMonitoringData,
  MonitoringEventHandlers,
  MonitoringServiceOptions,
} from './src/utils/monitoring';

// Load balancer
export * from './src/utils/loadbalancer';

export type {
  LoadBalanceStrategy,
} from './src/utils/loadbalancer';

// Webhooks
export {
  WebhookService,
  type WebhookConfig,
} from './src/utils/webhooks';

// Deployment
export {
  deploy,
  validateDeploymentConfig,
  type DeploymentResult,
  type DeploymentOptions,
} from './src/utils/deployment';

// CLI exports (for programmatic usage)
export { main, createProgram } from './src/cli';
export * from './src/cli/commands';

// Import for side-effects (initialization)
import './src/utils/logger';
import './src/utils/events';
