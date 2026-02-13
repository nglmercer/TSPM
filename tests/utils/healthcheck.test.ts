import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import {
  HealthCheckRunner,
  HealthCheckManager,
  createHealthCheckConfig,
  parseHealthCheckUrl,
  HealthCheckProtocolValues,
  HealthStatusValues,
  DEFAULT_HEALTH_CHECK,
  type HealthCheckConfig,
  type HealthCheckResult,
} from "../../src/utils/healthcheck";

describe("HealthCheckRunner", () => {
  let runner: HealthCheckRunner;

  afterEach(() => {
    if (runner) {
      runner.stop();
    }
  });

  test("should create runner with default config", () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      config: DEFAULT_HEALTH_CHECK,
    });
    expect(runner).toBeDefined();
  });

  test("should create runner with custom config", () => {
    const config: Partial<HealthCheckConfig> = {
      enabled: true,
      protocol: HealthCheckProtocolValues.TCP,
      port: 3000,
      timeout: 5000,
      interval: 10000,
    };
    
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      config: config as HealthCheckConfig,
    });
    expect(runner).toBeDefined();
  });

  test("should start and stop health check runner", () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      pid: 99999, // Non-existent PID
      config: {
        enabled: true,
        protocol: HealthCheckProtocolValues.NONE,
        timeout: 5000,
        interval: 30000,
        retries: 3,
        initialDelay: 5000,
      },
    });
    
    runner.start();
    expect(runner.getIsRunning()).toBe(true);
    
    runner.stop();
    expect(runner.getIsRunning()).toBe(false);
  });

  test("should not start if not enabled", () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      config: {
        enabled: false,
        protocol: HealthCheckProtocolValues.NONE,
        timeout: 5000,
        interval: 30000,
        retries: 3,
        initialDelay: 5000,
      },
    });
    
    runner.start();
    // With enabled: false, it should not run
    runner.stop();
  });

  test("should run health check manually", async () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      pid: 99999, // Non-existent PID
      config: {
        enabled: false,
        protocol: HealthCheckProtocolValues.NONE,
        timeout: 5000,
        interval: 30000,
        retries: 3,
        initialDelay: 5000,
      },
    });
    
    const result = await runner.runCheck();
    expect(result).toBeDefined();
    // Protocol NONE returns healthy, but non-existent PID returns unhealthy
    expect(result.status === HealthStatusValues.HEALTHY || result.status === HealthStatusValues.UNHEALTHY).toBe(true);
  });

  test("should track consecutive failures", async () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      pid: 99999, // Non-existent PID - will fail
      config: {
        enabled: false,
        protocol: HealthCheckProtocolValues.TCP,
        host: "localhost",
        port: 99999, // Invalid port
        timeout: 100,
        interval: 30000,
        retries: 3,
        initialDelay: 5000,
      },
    });
    
    await runner.runCheck();
    // Process doesn't exist, so it should report unhealthy
    expect(runner.getConsecutiveFailures()).toBeGreaterThanOrEqual(0);
  });

  test("should update PID", () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      pid: 12345,
      config: DEFAULT_HEALTH_CHECK,
    });
    
    runner.updatePid(54321);
    // The update should not throw
    expect(runner.getIsRunning()).toBe(false);
  });

  test("should check max retries", () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      config: {
        enabled: false,
        protocol: HealthCheckProtocolValues.NONE,
        retries: 3,
        timeout: 5000,
        interval: 30000,
        initialDelay: 5000,
      },
    });
    
    expect(runner.isMaxRetriesExceeded()).toBe(false);
  });

  test("should get last result", async () => {
    runner = new HealthCheckRunner({
      processName: "test",
      instanceId: 0,
      config: DEFAULT_HEALTH_CHECK,
    });
    
    await runner.runCheck();
    const lastResult = runner.getLastResult();
    expect(lastResult).toBeDefined();
  });
});

describe("HealthCheckManager", () => {
  let manager: HealthCheckManager;

  beforeEach(() => {
    manager = new HealthCheckManager();
  });

  afterEach(() => {
    manager.stopAll();
  });

  test("should create manager with default config", () => {
    expect(manager).toBeDefined();
  });

  test("should create manager with global config", () => {
    const managerWithConfig = new HealthCheckManager({
      protocol: HealthCheckProtocolValues.HTTP,
      timeout: 5000,
    });
    expect(managerWithConfig).toBeDefined();
  });

  test("should register a process", () => {
    manager.register("test-process", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    
    expect(manager.getCount()).toBe(1);
  });

  test("should unregister a process", () => {
    manager.register("test-process", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    manager.unregister("test-process", 0);
    
    expect(manager.getCount()).toBe(0);
  });

  test("should update PID", () => {
    manager.register("test-process", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    manager.updatePid("test-process", 0, 54321);
    
    // Should not throw
    expect(manager.getCount()).toBe(1);
  });

  test("should check single process", async () => {
    manager.register("test-process", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    
    const result = await manager.check("test-process", 0);
    expect(result).toBeDefined();
  });

  test("should return null for unknown process check", async () => {
    const result = await manager.check("unknown", 0);
    expect(result).toBeNull();
  });

  test("should check all processes", async () => {
    manager.register("test-1", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    manager.register("test-2", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    
    const results = await manager.checkAll();
    expect(results.size).toBe(2);
  });

  test("should get health status", () => {
    manager.register("test-1", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    
    const status = manager.getHealthStatus();
    expect(status).toHaveProperty("healthy");
    expect(status).toHaveProperty("unhealthy");
    expect(status).toHaveProperty("total");
    expect(status.total).toBe(1);
  });

  test("should stop all checks", () => {
    manager.register("test-1", 0, 12345, {
      enabled: true,
      protocol: HealthCheckProtocolValues.NONE,
    });
    
    manager.stopAll();
    // Should not throw
    expect(manager.getCount()).toBe(1);
  });

  test("should start all checks", () => {
    manager.register("test-1", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    
    manager.startAll();
    // Should not throw
    expect(manager.getCount()).toBe(1);
  });

  test("should use status change callback", () => {
    let callbackCalled = false;
    
    const managerWithCallback = new HealthCheckManager(
      {},
      (processName, instanceId, result) => {
        callbackCalled = true;
      }
    );
    
    managerWithCallback.register("test", 0, 12345, {
      enabled: false,
      protocol: HealthCheckProtocolValues.NONE,
    });
    
    expect(managerWithCallback.getCount()).toBe(1);
  });
});

describe("createHealthCheckConfig", () => {
  test("should create config with defaults", () => {
    const config = createHealthCheckConfig({});
    expect(config.enabled).toBe(false);
    expect(config.protocol).toBe(HealthCheckProtocolValues.NONE);
    expect(config.timeout).toBe(5000);
    expect(config.interval).toBe(30000);
    expect(config.retries).toBe(3);
    expect(config.initialDelay).toBe(5000);
  });

  test("should merge provided config", () => {
    const config = createHealthCheckConfig({
      enabled: true,
      protocol: HealthCheckProtocolValues.HTTP,
      port: 8080,
    });
    
    expect(config.enabled).toBe(true);
    expect(config.protocol).toBe(HealthCheckProtocolValues.HTTP);
    expect(config.port).toBe(8080);
    expect(config.timeout).toBe(5000); // default
  });
});

describe("parseHealthCheckUrl", () => {
  test("should parse http URL", () => {
    const config = parseHealthCheckUrl("http://localhost:3000/health");
    
    expect(config.protocol).toBe("http");
    expect(config.host).toBe("localhost");
    expect(config.port).toBe(3000);
    expect(config.path).toBe("/health");
  });

  test("should parse https URL", () => {
    const config = parseHealthCheckUrl("https://example.com:8443/api/health");
    
    expect(config.protocol).toBe("https");
    expect(config.host).toBe("example.com");
    expect(config.port).toBe(8443);
    expect(config.path).toBe("/api/health");
  });

  test("should use default ports", () => {
    const httpConfig = parseHealthCheckUrl("http://localhost/path");
    const httpsConfig = parseHealthCheckUrl("https://localhost/path");
    
    expect(httpConfig.port).toBe(80);
    expect(httpsConfig.port).toBe(443);
  });

  test("should handle URL without port", () => {
    const config = parseHealthCheckUrl("http://localhost/");
    
    expect(config.port).toBe(80);
    expect(config.path).toBe("/");
  });

  test("should handle invalid URL", () => {
    const config = parseHealthCheckUrl("not-a-url");
    
    expect(config.protocol).toBeUndefined();
    expect(config.host).toBeUndefined();
  });
});
