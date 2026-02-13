/**
 * Event System for TSPM
 * Provides event-driven architecture for process state changes and monitoring
 * @module utils/events
 */

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
  /** Event type */
  type: EventType;
  /** Event timestamp */
  timestamp: number;
  /** Event source */
  source: string;
  /** Event priority */
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
    reason: 'manual' | 'error' | 'signal' | 'unknown';
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
    reason: 'manual' | 'signal' | 'error';
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
 * All event types
 */
export type TSPMEvent = 
  | ProcessStartEvent 
  | ProcessStopEvent 
  | ProcessRestartEvent 
  | ProcessExitEvent 
  | ProcessErrorEvent 
  | ProcessStateChangeEvent
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

/**
 * Event listener function
 */
export type EventListener = (event: TSPMEvent) => void | Promise<void>;

/**
 * Event listener with metadata
 */
export interface EventListenerEntry {
  listener: EventListener;
  priority: EventPriority;
  once: boolean;
}

/**
 * Event emitter options
 */
export interface EventEmitterOptions {
  /** Maximum listeners per event type (0 = unlimited) */
  maxListeners?: number;
  /** Enable event logging */
  verbose?: boolean;
  /** Error handler for listener errors */
  errorHandler?: (error: Error, event: TSPMEvent) => void;
}

/**
 * Event emitter class for TSPM
 */
export class EventEmitter {
  private listeners: Map<EventType, EventListenerEntry[]> = new Map();
  private wildcardListeners: EventListenerEntry[] = [];
  private eventHistory: TSPMEvent[] = [];
  private maxHistorySize: number = 100;
  private options: Required<EventEmitterOptions>;
  private eventCount: number = 0;

  constructor(options: EventEmitterOptions = {}) {
    this.options = {
      maxListeners: options.maxListeners ?? 0,
      verbose: options.verbose ?? false,
      errorHandler: options.errorHandler ?? ((error) => console.error('[TSPM Event Error]', error)),
    };
  }

  /**
   * Register an event listener
   */
  on(type: EventType, listener: EventListener, priority: EventPriority = EventPriorityValues.NORMAL): this {
    return this.addListener(type, listener, priority, false);
  }

  /**
   * Register a one-time event listener
   */
  once(type: EventType, listener: EventListener, priority: EventPriority = EventPriorityValues.NORMAL): this {
    return this.addListener(type, listener, priority, true);
  }

  /**
   * Add listener with options
   */
  private addListener(
    type: EventType, 
    listener: EventListener, 
    priority: EventPriority,
    once: boolean
  ): this {
    const listeners = this.getListenersForType(type);
    
    // Check max listeners limit
    if (this.options.maxListeners > 0 && listeners.length >= this.options.maxListeners) {
      console.warn(
        `[TSPM] Warning: Event listener limit (${this.options.maxListeners}) exceeded for "${type}"`
      );
    }

    listeners.push({ listener, priority, once });
    
    // Sort by priority (high > normal > low)
    listeners.sort((a, b) => {
      const priorityOrder = {
        [EventPriorityValues.HIGH]: 0,
        [EventPriorityValues.NORMAL]: 1,
        [EventPriorityValues.LOW]: 2,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (this.options.verbose) {
      console.log(`[TSPM] Listener added for "${type}" (priority: ${priority}, once: ${once})`);
    }

    return this;
  }

  /**
   * Remove an event listener
   */
  off(type: EventType, listener: EventListener): this {
    const listeners = this.getListenersForType(type);
    const index = listeners.findIndex(entry => entry.listener === listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      if (this.options.verbose) {
        console.log(`[TSPM] Listener removed for "${type}"`);
      }
    }

    return this;
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(type?: EventType): this {
    if (type) {
      this.listeners.delete(type);
      if (this.options.verbose) {
        console.log(`[TSPM] All listeners removed for "${type}"`);
      }
    } else {
      this.listeners.clear();
      this.wildcardListeners = [];
      if (this.options.verbose) {
        console.log('[TSPM] All listeners removed');
      }
    }

    return this;
  }

  /**
   * Register a wildcard listener (catches all events)
   */
  onAny(listener: EventListener, priority: EventPriority = EventPriorityValues.NORMAL): this {
    this.wildcardListeners.push({ listener, priority, once: false });
    return this;
  }

  /**
   * Emit an event
   */
  async emit(event: TSPMEvent): Promise<void> {
    this.eventCount++;
    
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    if (this.options.verbose) {
      console.log(`[TSPM] Event emitted: ${event.type}`);
    }

    // Get listeners for this event type
    const listeners = this.getListenersForType(event.type);
    
    // Combine with wildcard listeners
    const allListeners = [...this.wildcardListeners, ...listeners];
    
    // Execute listeners
    const promises: Promise<void>[] = [];
    
    for (const entry of allListeners) {
      try {
        const result = entry.listener(event);
        if (result instanceof Promise) {
          promises.push(result);
        }
        
        // Remove one-time listeners
        if (entry.once) {
          this.off(event.type, entry.listener);
        }
      } catch (error) {
        this.options.errorHandler(error as Error, event);
      }
    }

    await Promise.all(promises);
  }

  /**
   * Get listeners for a specific event type
   */
  private getListenersForType(type: EventType): EventListenerEntry[] {
    return this.listeners.get(type) || [];
  }

  /**
   * Get listener count for an event type
   */
  listenerCount(type: EventType): number {
    return this.getListenersForType(type).length;
  }

  /**
   * Get all registered event types
   */
  eventNames(): EventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get event history
   */
  getHistory(limit?: number): TSPMEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Get total event count
   */
  getEventCount(): number {
    return this.eventCount;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Create a child emitter (for namespaces)
   child(prefix: string): EventEmitter {
   *   const childEmitter = new EventEmitter(this.options);
   *   // Forward events with prefix
   *   this.onAny((event) => {
   *     childEmitter.emit({
   *       ...event,
   *       source: `${prefix}:${event.source}`,
   *     } as TSPMEvent);
   *   });
   *   return childEmitter;
   * }
   */

  /**
   * Get the raw listeners (for debugging)
   rawListeners(type: EventType): EventListener[] {
   *   return this.getListenersForType(type).map(entry => entry.listener);
   * }
   */
}

/**
 * Create a new event emitter instance
 */
export function createEventEmitter(options?: EventEmitterOptions): EventEmitter {
  return new EventEmitter(options);
}

/**
 * Create a typed event
 */
export function createEvent<T extends TSPMEvent>(
  type: T['type'],
  source: string,
  data: T['data'],
  priority: EventPriority = EventPriorityValues.NORMAL
): T {
  return {
    type,
    timestamp: Date.now(),
    source,
    priority,
    data,
  } as T;
}

/**
 * Default event emitter instance
 */
let defaultEmitter: EventEmitter | null = null;

/**
 * Get the default event emitter
 */
export function getDefaultEmitter(): EventEmitter {
  if (!defaultEmitter) {
    defaultEmitter = new EventEmitter();
  }
  return defaultEmitter;
}

/**
 * Helper to emit common process events
 */
export function emitProcessEvent(
  emitter: EventEmitter,
  type: Exclude<EventType, SystemEventType | ConfigEventType | MetricsEventType>,
  processName: string,
  instanceId: number,
  data: Record<string, unknown>
): void {
  emitter.emit(createEvent(
    type,
    processName,
    { processName, instanceId, ...data } as any,
    EventPriorityValues.NORMAL
  ));
}

// Type exports for specific event categories
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

/**
 * Event subscription for cleanup
 */
export class EventSubscription {
  private emitter: EventEmitter;
  private type: EventType;
  private listener: EventListener;

  constructor(emitter: EventEmitter, type: EventType, listener: EventListener) {
    this.emitter = emitter;
    this.type = type;
    this.listener = listener;
  }

  /**
   * Unsubscribe from the event
   */
  unsubscribe(): void {
    this.emitter.off(this.type, this.listener);
  }
}

/**
 * Subscribe to an event and return a subscription
 */
export function subscribe(
  emitter: EventEmitter,
  type: EventType,
  listener: EventListener,
  priority?: EventPriority
): EventSubscription {
  emitter.on(type, listener, priority);
  return new EventSubscription(emitter, type, listener);
}
