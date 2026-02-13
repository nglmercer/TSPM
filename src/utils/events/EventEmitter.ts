import { 
  type EventType, 
  type TSPMEvent, 
  type EventPriority, 
  type SystemEventType, 
  type ConfigEventType, 
  type MetricsEventType,
  EventTypeValues,
  EventPriorityValues 
} from './types';

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
  /** Maximum event history size */
  maxHistorySize?: number;
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
      maxHistorySize: options.maxHistorySize ?? 100,
    };
    this.maxHistorySize = this.options.maxHistorySize;
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
    let listeners = this.listeners.get(type);
    if (!listeners) {
      listeners = [];
      this.listeners.set(type, listeners);
    }
    
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
    }

    return this;
  }

  /**
   * Remove all listeners for an event type
   */
  removeAllListeners(type?: EventType): this {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
      this.wildcardListeners = [];
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
   * Get the number of listeners for a given event type
   */
  listenerCount(type: EventType): number {
    return this.getListenersForType(type).length;
  }

  /**
   * Get all registered event names
   */
  eventNames(): EventType[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get total event count
   */
  getEventCount(): number {
    return this.eventCount;
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
 * Create a new event emitter
 */
export function createEventEmitter(options?: EventEmitterOptions): EventEmitter {
  return new EventEmitter(options);
}

/**
 * Emit a typed process event to an emitter
 * Note: The data structure must match the event type being emitted.
 * For type safety, use createEvent() directly with proper event types.
 */
export function emitProcessEvent(
  emitter: EventEmitter,
  type: EventType,
  processName: string,
  instanceId: number,
  data: import('./types').TSPMEvent['data'] = {} as unknown as import('./types').TSPMEvent['data'],
  priority: EventPriority = EventPriorityValues.NORMAL
): void {
  const eventData = {
    processName,
    instanceId,
    ...data,
  };
  
  // Emit with explicit type cast for process events
  // The data always includes processName and instanceId for process events
  emitter.emit({
    type,
    timestamp: Date.now(),
    source: 'ManagedProcess',
    priority,
    data: eventData,
  } as TSPMEvent);
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
 * Event subscription for cleanup
 */
export class EventSubscription {
  constructor(
    private emitter: EventEmitter,
    private type: EventType,
    private listener: EventListener
  ) {}

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
