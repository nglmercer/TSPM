import { expect, test, describe, beforeEach } from "bun:test";
import { 
  EventEmitter, 
  createEventEmitter, 
  createEvent, 
  getDefaultEmitter,
  emitProcessEvent,
  EventSubscription,
  subscribe,
  EventTypeValues,
  EventPriorityValues,
  type TSPMEvent,
  type EventType,
  type EventListener
} from "../../src/utils/events";

describe("EventEmitter", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  test("should create instance with default options", () => {
    const emitter = new EventEmitter();
    expect(emitter).toBeDefined();
  });

  test("should create instance with custom options", () => {
    const emitter = new EventEmitter({ 
      maxListeners: 5, 
      verbose: true 
    });
    expect(emitter).toBeDefined();
  });

  test("should register and call listener", async () => {
    let callCount = 0;
    const listener: EventListener = () => {
      callCount++;
    };
    
    emitter.on(EventTypeValues.PROCESS_START, listener);
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    expect(callCount).toBe(1);
  });

  test("should register once listener", async () => {
    let callCount = 0;
    const listener: EventListener = () => {
      callCount++;
    };
    
    emitter.once(EventTypeValues.PROCESS_START, listener);
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    expect(callCount).toBe(1);
  });

  test("should call listener with event data", async () => {
    let receivedEvent: TSPMEvent | null = null;
    const listener: EventListener = (event) => {
      receivedEvent = event;
    };
    
    emitter.on(EventTypeValues.PROCESS_START, listener);
    const testEvent = createEvent(
      EventTypeValues.PROCESS_START,
      "test-source",
      { processName: "my-process", instanceId: 1, config: { script: "test.js" } }
    );
    await emitter.emit(testEvent);
    
    expect(receivedEvent).not.toBeNull();
    expect(receivedEvent!.type).toBe(EventTypeValues.PROCESS_START);
    expect((receivedEvent!.data as any).processName).toBe("my-process");
  });

  test("should remove listener with off", async () => {
    let callCount = 0;
    const listener: EventListener = () => {
      callCount++;
    };
    
    emitter.on(EventTypeValues.PROCESS_START, listener);
    emitter.off(EventTypeValues.PROCESS_START, listener);
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    expect(callCount).toBe(0);
  });

  test("should remove all listeners of a type", async () => {
    let callCount = 0;
    const listener1: EventListener = () => { callCount++; };
    const listener2: EventListener = () => { callCount++; };
    
    emitter.on(EventTypeValues.PROCESS_START, listener1);
    emitter.on(EventTypeValues.PROCESS_START, listener2);
    emitter.removeAllListeners(EventTypeValues.PROCESS_START);
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    expect(callCount).toBe(0);
  });

  test("should remove all listeners when no type specified", async () => {
    let callCount = 0;
    const listener: EventListener = () => { callCount++; };
    
    emitter.on(EventTypeValues.PROCESS_START, listener);
    emitter.on(EventTypeValues.PROCESS_STOP, listener);
    emitter.removeAllListeners();
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_STOP,
      "test",
      { processName: "test", instanceId: 0, reason: "manual" }
    ));
    
    expect(callCount).toBe(0);
  });

  test("should register wildcard listener with onAny", async () => {
    let callCount = 0;
    const listener: EventListener = () => {
      callCount++;
    };
    
    emitter.onAny(listener);
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_STOP,
      "test",
      { processName: "test", instanceId: 0, reason: "manual" }
    ));
    
    expect(callCount).toBe(2);
  });

  test("should respect priority order", async () => {
    const calls: number[] = [];
    const highPriority: EventListener = () => { calls.push(1); };
    const normalPriority: EventListener = () => { calls.push(2); };
    const lowPriority: EventListener = () => { calls.push(3); };
    
    emitter.on(EventTypeValues.PROCESS_START, normalPriority, EventPriorityValues.NORMAL);
    emitter.on(EventTypeValues.PROCESS_START, lowPriority, EventPriorityValues.LOW);
    emitter.on(EventTypeValues.PROCESS_START, highPriority, EventPriorityValues.HIGH);
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    expect(calls).toEqual([1, 2, 3]);
  });

  test("should track listener count", () => {
    const listener: EventListener = () => {};
    
    expect(emitter.listenerCount(EventTypeValues.PROCESS_START)).toBe(0);
    emitter.on(EventTypeValues.PROCESS_START, listener);
    expect(emitter.listenerCount(EventTypeValues.PROCESS_START)).toBe(1);
  });

  test("should return event names", () => {
    emitter.on(EventTypeValues.PROCESS_START, () => {});
    emitter.on(EventTypeValues.PROCESS_STOP, () => {});
    
    const names = emitter.eventNames();
    expect(names).toContain(EventTypeValues.PROCESS_START);
    expect(names).toContain(EventTypeValues.PROCESS_STOP);
  });

  test("should track event history", async () => {
    emitter.on(EventTypeValues.PROCESS_START, () => {});
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    const history = emitter.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe(EventTypeValues.PROCESS_START);
  });

  test("should limit history size", async () => {
    const customEmitter = new EventEmitter({ maxHistorySize: 5 });
    
    for (let i = 0; i < 10; i++) {
      await customEmitter.emit(createEvent(
        EventTypeValues.PROCESS_START,
        "test",
        { processName: `test-${i}`, instanceId: i, config: {} }
      ));
    }
    
    const history = customEmitter.getHistory();
    expect(history).toHaveLength(5);
  });

  test("should get history with limit", async () => {
    emitter.on(EventTypeValues.PROCESS_START, () => {});
    
    for (let i = 0; i < 5; i++) {
      await emitter.emit(createEvent(
        EventTypeValues.PROCESS_START,
        "test",
        { processName: `test-${i}`, instanceId: i, config: {} }
      ));
    }
    
    const history = emitter.getHistory(3);
    expect(history).toHaveLength(3);
  });

  test("should clear history", async () => {
    emitter.on(EventTypeValues.PROCESS_START, () => {});
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    emitter.clearHistory();
    const history = emitter.getHistory();
    expect(history).toHaveLength(0);
  });

  test("should track event count", async () => {
    emitter.on(EventTypeValues.PROCESS_START, () => {});
    emitter.on(EventTypeValues.PROCESS_STOP, () => {});
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_STOP,
      "test",
      { processName: "test", instanceId: 0, reason: "manual" }
    ));
    
    expect(emitter.getEventCount()).toBe(2);
  });

  test("should handle async listeners", async () => {
    let resolveOrder: string[] = [];
    
    const asyncListener: EventListener = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      resolveOrder.push("async");
    };
    
    const syncListener: EventListener = () => {
      resolveOrder.push("sync");
    };
    
    emitter.on(EventTypeValues.PROCESS_START, asyncListener);
    emitter.on(EventTypeValues.PROCESS_START, syncListener);
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    // Both should complete
    expect(resolveOrder).toContain("async");
    expect(resolveOrder).toContain("sync");
  });

  test("should handle errors in listeners", async () => {
    const errorHandler = (error: Error, event: TSPMEvent) => {
      // Expected to be called
    };
    
    const emitterWithHandler = new EventEmitter({ errorHandler });
    const errorListener: EventListener = () => {
      throw new Error("Test error");
    };
    
    emitterWithHandler.on(EventTypeValues.PROCESS_START, errorListener);
    
    // Should not throw
    await emitterWithHandler.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
  });
});

describe("createEventEmitter", () => {
  test("should create new emitter", () => {
    const emitter = createEventEmitter();
    expect(emitter).toBeInstanceOf(EventEmitter);
  });

  test("should create emitter with options", () => {
    const emitter = createEventEmitter({ maxListeners: 10 });
    expect(emitter).toBeInstanceOf(EventEmitter);
  });
});

describe("createEvent", () => {
  test("should create typed event", () => {
    const event = createEvent(
      EventTypeValues.PROCESS_START,
      "test-source",
      { processName: "my-process", instanceId: 1, config: {} }
    );
    
    expect(event.type).toBe(EventTypeValues.PROCESS_START);
    expect(event.source).toBe("test-source");
    expect(event.timestamp).toBeDefined();
    expect(event.priority).toBe(EventPriorityValues.NORMAL);
    expect((event.data as any).processName).toBe("my-process");
  });

  test("should create event with custom priority", () => {
    const event = createEvent(
      EventTypeValues.PROCESS_START,
      "test-source",
      { processName: "my-process", instanceId: 1, config: {} },
      EventPriorityValues.HIGH
    );
    
    expect(event.priority).toBe(EventPriorityValues.HIGH);
  });
});

describe("getDefaultEmitter", () => {
  test("should return default emitter", () => {
    const emitter1 = getDefaultEmitter();
    const emitter2 = getDefaultEmitter();
    
    expect(emitter1).toBe(emitter2);
  });
});

describe("emitProcessEvent", () => {
  test("should emit process event", async () => {
    const emitter = new EventEmitter();
    let receivedEvent: TSPMEvent | null = null;
    
    emitter.on(EventTypeValues.PROCESS_START, (event) => {
      receivedEvent = event;
    });
    
    emitProcessEvent(emitter, EventTypeValues.PROCESS_START, "test-process", 0, { pid: 123 });
    
    // Wait for async emission
    await new Promise(resolve => setTimeout(resolve, 10));
    
    expect(receivedEvent).not.toBeNull();
    expect((receivedEvent!.data as any).processName).toBe("test-process");
    expect((receivedEvent!.data as any).instanceId).toBe(0);
    expect((receivedEvent!.data as any).pid).toBe(123);
  });
});

describe("EventSubscription", () => {
  test("should unsubscribe correctly", async () => {
    const emitter = new EventEmitter();
    let callCount = 0;
    const listener: EventListener = () => { callCount++; };
    
    const subscription = new EventSubscription(emitter, EventTypeValues.PROCESS_START, listener);
    subscription.unsubscribe();
    
    await emitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      "test",
      { processName: "test", instanceId: 0, config: {} }
    ));
    
    expect(callCount).toBe(0);
  });
});

describe("subscribe", () => {
  test("should return subscription", () => {
    const emitter = new EventEmitter();
    const listener: EventListener = () => {};
    
    const subscription = subscribe(emitter, EventTypeValues.PROCESS_START, listener);
    
    expect(subscription).toBeInstanceOf(EventSubscription);
  });

  test("should subscribe with priority", () => {
    const emitter = new EventEmitter();
    const listener: EventListener = () => {};
    
    const subscription = subscribe(
      emitter, 
      EventTypeValues.PROCESS_START, 
      listener, 
      EventPriorityValues.HIGH
    );
    
    expect(subscription).toBeInstanceOf(EventSubscription);
  });
});
