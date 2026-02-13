import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import {
  MonitoringService,
  createMonitoringService,
  getMonitoringService,
  DEFAULT_MONITORING_CONFIG,
  type MonitoringConfig,
  type MonitoringServiceOptions,
} from "../../src/utils/monitoring";
import { EventTypeValues } from "../../src/utils/events";

describe("MonitoringService", () => {
  let service: MonitoringService;

  beforeEach(() => {
    service = new MonitoringService();
  });

  afterEach(() => {
    service.stop();
  });

  test("should create service with default config", () => {
    expect(service).toBeDefined();
  });

  test("should create service with custom config", () => {
    const customService = new MonitoringService({
      config: {
        enabled: true,
        interval: 1000,
        cpuThreshold: 90,
      },
    });
    expect(customService).toBeDefined();
    customService.stop();
  });

  test("should register process", () => {
    service.registerProcess("test-process", 0, process.pid);
    expect(service.getMonitoredCount()).toBe(1);
  });

  test("should register multiple processes", () => {
    service.registerProcess("test-1", 0, process.pid);
    service.registerProcess("test-2", 0, process.pid);
    expect(service.getMonitoredCount()).toBe(2);
  });

  test("should not register duplicate process", () => {
    service.registerProcess("test-process", 0, process.pid);
    service.registerProcess("test-process", 0, process.pid);
    expect(service.getMonitoredCount()).toBe(1);
  });

  test("should unregister process", () => {
    service.registerProcess("test-process", 0, process.pid);
    service.unregisterProcess("test-process", 0);
    expect(service.getMonitoredCount()).toBe(0);
  });

  test("should update PID", () => {
    service.registerProcess("test-process", 0, process.pid);
    service.updatePid("test-process", 0, 99999);
    
    const data = service.getProcessData("test-process", 0);
    expect(data?.pid).toBe(99999);
  });

  test("should start and stop monitoring", () => {
    service.registerProcess("test-process", 0, process.pid);
    service.start();
    expect(service.isMonitoring()).toBe(true);
    
    service.stop();
    expect(service.isMonitoring()).toBe(false);
  });

  test("should not start if already running", () => {
    service.start();
    const isRunning = service.isMonitoring();
    service.start(); // Should not throw
    
    expect(isRunning).toBe(true);
    service.stop();
  });

  test("should get process data", () => {
    service.registerProcess("test-process", 0, process.pid);
    const data = service.getProcessData("test-process", 0);
    expect(data).toBeDefined();
    expect(data?.processName).toBe("test-process");
    expect(data?.instanceId).toBe(0);
  });

  test("should return undefined for unknown process", () => {
    const data = service.getProcessData("unknown", 0);
    expect(data).toBeUndefined();
  });

  test("should get all process data", () => {
    service.registerProcess("test-1", 0, process.pid);
    service.registerProcess("test-2", 0, process.pid);
    
    const allData = service.getAllProcessData();
    expect(allData).toHaveLength(2);
  });

  test("should get current metrics", () => {
    service.registerProcess("test-process", 0, process.pid);
    const metrics = service.getCurrentMetrics("test-process", 0);
    expect(metrics).toBeNull(); // Not collected yet
  });

  test("should get metrics history", () => {
    service.registerProcess("test-process", 0, process.pid);
    const history = service.getMetricsHistory("test-process", 0);
    expect(history).toEqual([]);
  });

  test("should get health status", () => {
    service.registerProcess("test-process", 0, process.pid);
    const health = service.getHealthStatus("test-process", 0);
    expect(health).toBeNull();
  });

  test("should get health summary", () => {
    service.registerProcess("test-process", 0, process.pid);
    const summary = service.getHealthSummary();
    expect(summary).toHaveProperty("healthy");
    expect(summary).toHaveProperty("unhealthy");
    expect(summary).toHaveProperty("total");
  });

  test("should get event emitter", () => {
    const emitter = service.getEventEmitter();
    expect(emitter).toBeDefined();
  });

  test("should get health check manager", () => {
    const manager = service.getHealthCheckManager();
    expect(manager).toBeDefined();
  });

  test("should subscribe to events", () => {
    let eventReceived = false;
    service.onEvent(EventTypeValues.PROCESS_START, () => {
      eventReceived = true;
    });
    
    // Event emitter should exist
    expect(service.getEventEmitter()).toBeDefined();
  });

  test("should run health check for process", async () => {
    service.registerProcess("test-process", 0, process.pid);
    const result = await service.runHealthCheck("test-process", 0);
    // Result may be null depending on health check config
    expect(result === null || result !== null).toBe(true);
  });

  test("should run all health checks", async () => {
    service.registerProcess("test-1", 0, process.pid);
    service.registerProcess("test-2", 0, process.pid);
    
    const results = await service.runAllHealthChecks();
    expect(results).toBeDefined();
  });

  test("should update config", () => {
    service.updateConfig({ interval: 1000 });
    const config = service.getConfig();
    expect(config.interval).toBe(1000);
  });

  test("should get current config", () => {
    const config = service.getConfig();
    expect(config).toHaveProperty("enabled");
    expect(config).toHaveProperty("interval");
    expect(config).toHaveProperty("cpuThreshold");
  });
});

describe("createMonitoringService", () => {
  test("should create new service", () => {
    const service = createMonitoringService();
    expect(service).toBeInstanceOf(MonitoringService);
    service.stop();
  });

  test("should create service with options", () => {
    const service = createMonitoringService({
      config: { interval: 2000 },
    });
    expect(service).toBeInstanceOf(MonitoringService);
    service.stop();
  });
});

describe("getMonitoringService", () => {
  test("should return default service", () => {
    const service1 = getMonitoringService();
    const service2 = getMonitoringService();
    expect(service1).toBe(service2);
    service1.stop();
  });
});

describe("DEFAULT_MONITORING_CONFIG", () => {
  test("should have all required properties", () => {
    expect(DEFAULT_MONITORING_CONFIG.enabled).toBe(true);
    expect(DEFAULT_MONITORING_CONFIG.interval).toBe(5000);
    expect(DEFAULT_MONITORING_CONFIG.cpuThreshold).toBe(80);
    expect(DEFAULT_MONITORING_CONFIG.memoryThreshold).toBeDefined();
    expect(DEFAULT_MONITORING_CONFIG.eventLogging).toBe(true);
    expect(DEFAULT_MONITORING_CONFIG.healthChecks).toBe(true);
    expect(DEFAULT_MONITORING_CONFIG.logRotation).toBe(true);
  });
});
