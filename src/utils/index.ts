/**
 * Utils module index
 * Exports all utility modules for TSPM
 */

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
} from './events';

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
} from './events';

// Health check system
export {
  HealthCheckManager,
  HealthCheckRunner,
  HealthCheckProtocolValues,
  HealthStatusValues,
  DEFAULT_HEALTH_CHECK,
  createHealthCheckConfig,
  parseHealthCheckUrl,
} from './healthcheck';

export type {
  HealthCheckConfig,
  HealthCheckResult,
  HealthCheckOptions,
  HealthCheckProtocol,
  HealthStatus,
} from './healthcheck';

// Logger
export {
  Logger,
  LogManager,
  LogLevelValues,
  getLogger,
  createLogger,
  log,
} from './logger';

export type {
  LogLevel,
  LogMetadata,
  LogEntry,
  LoggerOptions,
} from './logger';

// Stats
export {
  getProcessStats,
} from './stats';

export type {
  ProcessStats,
} from './stats';

// Monitoring service
export {
  MonitoringService,
  DEFAULT_MONITORING_CONFIG,
  getMonitoringService,
  createMonitoringService,
} from './monitoring';

export type {
  MonitoringConfig,
  ProcessMetrics,
  ProcessMonitoringData,
  MonitoringEventHandlers,
  MonitoringServiceOptions,
} from './monitoring';
