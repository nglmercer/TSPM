import { 
  STOP_REASON, 
  RESTART_REASON, 
  LOG_TYPE, 
  SYSTEM_STOP_REASON,
  type StopReason,
  type RestartReason,
  type LogType,
  type SystemStopReason
} from '../config/constants';

/**
 * Event types for TSPM
 */
export const EventTypeValues = {
  // Process lifecycle events
  PROCESS_START: 'process:start',
  PROCESS_STOP: 'process:stop',
  PROCESS_RESTART: 'process:restart',
  PROCESS_EXIT: 'process:exit',
  PROCESS_ERROR: 'process:error',
  PROCESS_STATE_CHANGE: 'process:state-change',
  PROCESS_LOG: 'process:log',
  PROCESS_OOM: 'process:oom',
  
  // Cluster events
  INSTANCE_ADD: 'instance:add',
  INSTANCE_REMOVE: 'instance:remove',
  INSTANCE_HEALTH_CHANGE: 'instance:health-change',
  
  // System events
  SYSTEM_START: 'system:start',
  SYSTEM_STOP: 'system:stop',
  SYSTEM_ERROR: 'system:error',
  
  // Monitoring events
  METRICS_UPDATE: 'metrics:update',
  CPU_HIGH: 'metrics:cpu-high',
  MEMORY_HIGH: 'metrics:memory-high',
  
  // Config events
  CONFIG_RELOAD: 'config:reload',
  CONFIG_CHANGE: 'config:change',
} as const;

export type EventType = typeof EventTypeValues[keyof typeof EventTypeValues];

/**
 * Event priority levels
 */
export const EventPriorityValues = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
} as const;

export type EventPriority = typeof EventPriorityValues[keyof typeof EventPriorityValues];

/**
 * Base event interface
 */
export interface BaseEvent {
  type: EventType;
  timestamp: number;
  source: string;
  priority: EventPriority;
}

/**
 * Process start event
 */
export interface ProcessStartEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_START;
  data: {
    processName: string;
    instanceId: number;
    pid?: number;
    config: Record<string, unknown>;
  };
}

/**
 * Process stop event
 */
export interface ProcessStopEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_STOP;
  data: {
    processName: string;
    instanceId: number;
    pid?: number;
    reason: StopReason;
  };
}

/**
 * Process restart event
 */
export interface ProcessRestartEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_RESTART;
  data: {
    processName: string;
    instanceId: number;
    restartCount: number;
    delay?: number;
    reason?: RestartReason;
  };
}

/**
 * Process exit event
 */
export interface ProcessExitEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_EXIT;
  data: {
    processName: string;
    instanceId: number;
    exitCode: number | null;
    signal: string | null;
  };
}

/**
 * Process error event
 */
export interface ProcessErrorEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_ERROR;
  data: {
    processName: string;
    instanceId: number;
    error: string;
    stack?: string;
  };
}

/**
 * Process state change event
 */
export interface ProcessStateChangeEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_STATE_CHANGE;
  data: {
    processName: string;
    instanceId: number;
    previousState: string;
    currentState: string;
  };
}

/**
 * Instance add event
 */
export interface InstanceAddEvent extends BaseEvent {
  type: typeof EventTypeValues.INSTANCE_ADD;
  data: {
    processName: string;
    instanceId: number;
    totalInstances: number;
  };
}

/**
 * Instance remove event
 */
export interface InstanceRemoveEvent extends BaseEvent {
  type: typeof EventTypeValues.INSTANCE_REMOVE;
  data: {
    processName: string;
    instanceId: number;
    remainingInstances: number;
  };
}

/**
 * Instance health change event
 */
export interface InstanceHealthChangeEvent extends BaseEvent {
  type: typeof EventTypeValues.INSTANCE_HEALTH_CHANGE;
  data: {
    processName: string;
    instanceId: number;
    healthy: boolean;
  };
}

/**
 * Metrics update event
 */
export interface MetricsUpdateEvent extends BaseEvent {
  type: typeof EventTypeValues.METRICS_UPDATE;
  data: {
    processName: string;
    instanceId: number;
    metrics: {
      cpu: number;
      memory: number;
      uptime: number;
    };
  };
}

/**
 * CPU high event
 */
export interface CpuHighEvent extends BaseEvent {
  type: typeof EventTypeValues.CPU_HIGH;
  data: {
    processName: string;
    instanceId: number;
    cpu: number;
    threshold: number;
  };
}

/**
 * Memory high event
 */
export interface MemoryHighEvent extends BaseEvent {
  type: typeof EventTypeValues.MEMORY_HIGH;
  data: {
    processName: string;
    instanceId: number;
    memory: number;
    threshold: number;
  };
}

/**
 * Process log event
 */
export interface ProcessLogEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_LOG;
  data: {
    processName: string;
    instanceId: number;
    message: string;
    type: LogType;
  };
}

/**
 * Process OOM (Out-of-Memory) event
 */
export interface ProcessOOMEvent extends BaseEvent {
  type: typeof EventTypeValues.PROCESS_OOM;
  data: {
    processName: string;
    instanceId: number;
    memory: number;
    limit: number;
  };
}

/**
 * System start event
 */
export interface SystemStartEvent extends BaseEvent {
  type: typeof EventTypeValues.SYSTEM_START;
  data: {
    configFile: string;
    processCount: number;
  };
}

/**
 * System stop event
 */
export interface SystemStopEvent extends BaseEvent {
  type: typeof EventTypeValues.SYSTEM_STOP;
  data: {
    reason: SystemStopReason;
    graceful: boolean;
  };
}

/**
 * System error event
 */
export interface SystemErrorEvent extends BaseEvent {
  type: typeof EventTypeValues.SYSTEM_ERROR;
  data: {
    error: string;
    stack?: string;
  };
}

/**
 * Config reload event
 */
export interface ConfigReloadEvent extends BaseEvent {
  type: typeof EventTypeValues.CONFIG_RELOAD;
  data: {
    configFile: string;
    changes: string[];
  };
}

/**
 * All event types union
 */
export type TSPMEvent = 
  | ProcessStartEvent 
  | ProcessStopEvent 
  | ProcessRestartEvent 
  | ProcessExitEvent 
  | ProcessErrorEvent 
  | ProcessStateChangeEvent
  | ProcessLogEvent
  | ProcessOOMEvent
  | InstanceAddEvent 
  | InstanceRemoveEvent 
  | InstanceHealthChangeEvent
  | MetricsUpdateEvent 
  | CpuHighEvent 
  | MemoryHighEvent
  | SystemStartEvent 
  | SystemStopEvent 
  | SystemErrorEvent
  | ConfigReloadEvent;

export type SystemEventType = 
  | typeof EventTypeValues.SYSTEM_START 
  | typeof EventTypeValues.SYSTEM_STOP 
  | typeof EventTypeValues.SYSTEM_ERROR;

export type ConfigEventType = 
  | typeof EventTypeValues.CONFIG_RELOAD 
  | typeof EventTypeValues.CONFIG_CHANGE;

export type MetricsEventType = 
  | typeof EventTypeValues.METRICS_UPDATE 
  | typeof EventTypeValues.CPU_HIGH 
  | typeof EventTypeValues.MEMORY_HIGH;
