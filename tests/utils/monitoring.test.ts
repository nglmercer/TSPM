/**
 * Tests for Monitoring Service
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { MonitoringService, DEFAULT_MONITORING_CONFIG, createMonitoringService } from '../../src/utils/monitoring';
import { EventTypeValues } from '../../src/utils/events';

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    monitoringService = createMonitoringService({
      config: {
        interval: 100, // Fast interval for testing
        cpuThreshold: 80,
        memoryThreshold: 500 * 1024 * 1024,
      },
    });
  });

  afterEach(() => {
    monitoringService.stop();
  });

  describe('constructor', () => {
    it('should create a monitoring service with default config', () => {
      const service = createMonitoringService();
      const config = service.getConfig();
      
      expect(config.enabled).toBe(true);
      expect(config.interval).toBe(DEFAULT_MONITORING_CONFIG.interval);
      expect(config.cpuThreshold).toBe(DEFAULT_MONITORING_CONFIG.cpuThreshold);
    });

    it('should merge custom config with defaults', () => {
      const service = createMonitoringService({
        config: {
          interval: 2000,
          cpuThreshold: 90,
        },
      });
      
      const config = service.getConfig();
      expect(config.interval).toBe(2000);
      expect(config.cpuThreshold).toBe(90);
      expect(config.memoryThreshold).toBe(DEFAULT_MONITORING_CONFIG.memoryThreshold);
    });
  });

  describe('registerProcess', () => {
    it('should register a process for monitoring', () => {
      monitoringService.registerProcess('test-process', 0, 12345);
      
      expect(monitoringService.getMonitoredCount()).toBe(1);
      
      const data = monitoringService.getProcessData('test-process', 0);
      expect(data).toBeDefined();
      expect(data?.processName).toBe('test-process');
      expect(data?.instanceId).toBe(0);
      expect(data?.pid).toBe(12345);
    });

    it('should not duplicate process registration', () => {
      monitoringService.registerProcess('test-process', 0, 12345);
      monitoringService.registerProcess('test-process', 0, 12345);
      
      expect(monitoringService.getMonitoredCount()).toBe(1);
    });

    it('should register multiple instances of same process', () => {
      monitoringService.registerProcess('test-process', 0, 12345);
      monitoringService.registerProcess('test-process', 1, 12346);
      
      expect(monitoringService.getMonitoredCount()).toBe(2);
    });
  });

  describe('unregisterProcess', () => {
    it('should unregister a process', () => {
      monitoringService.registerProcess('test-process', 0, 12345);
      expect(monitoringService.getMonitoredCount()).toBe(1);
      
      monitoringService.unregisterProcess('test-process', 0);
      expect(monitoringService.getMonitoredCount()).toBe(0);
    });

    it('should handle unregistering non-existent process', () => {
      monitoringService.unregisterProcess('non-existent', 0);
      expect(monitoringService.getMonitoredCount()).toBe(0);
    });
  });

  describe('start/stop', () => {
    it('should start monitoring', () => {
      monitoringService.registerProcess('test-process', 0, 12345);
      monitoringService.start();
      
      expect(monitoringService.isMonitoring()).toBe(true);
    });

    it('should stop monitoring', () => {
      monitoringService.registerProcess('test-process', 0, 12345);
      monitoringService.start();
      monitoringService.stop();
      
      expect(monitoringService.isMonitoring()).toBe(false);
    });

    it('should not start twice', () => {
      monitoringService.start();
      monitoringService.start();
      
      expect(monitoringService.isMonitoring()).toBe(true);
    });
  });

  describe('event handling', () => {
    it('should emit instance add event on registration', async () => {
      let eventReceived = false;
      
      monitoringService.onEvent(EventTypeValues.INSTANCE_ADD, () => {
        eventReceived = true;
      });
      
      monitoringService.registerProcess('test-process', 0, 12345);
      
      // Wait for event to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(eventReceived).toBe(true);
    });

    it('should emit instance remove event on unregistration', async () => {
      let eventReceived = false;
      
      monitoringService.onEvent(EventTypeValues.INSTANCE_REMOVE, () => {
        eventReceived = true;
      });
      
      monitoringService.registerProcess('test-process', 0, 12345);
      monitoringService.unregisterProcess('test-process', 0);
      
      // Wait for event to be processed
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(eventReceived).toBe(true);
    });
  });

  describe('getProcessData', () => {
    it('should return undefined for non-existent process', () => {
      const data = monitoringService.getProcessData('non-existent', 0);
      expect(data).toBeUndefined();
    });

    it('should return process data for registered process', () => {
      monitoringService.registerProcess('test-process', 0, 12345);
      
      const data = monitoringService.getProcessData('test-process', 0);
      expect(data).toBeDefined();
      expect(data?.processName).toBe('test-process');
      expect(data?.pid).toBe(12345);
    });
  });

  describe('getAllProcessData', () => {
    it('should return empty array when no processes registered', () => {
      const allData = monitoringService.getAllProcessData();
      expect(allData).toHaveLength(0);
    });

    it('should return all registered processes', () => {
      monitoringService.registerProcess('process-1', 0, 12345);
      monitoringService.registerProcess('process-2', 0, 12346);
      
      const allData = monitoringService.getAllProcessData();
      expect(allData).toHaveLength(2);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      monitoringService.updateConfig({ cpuThreshold: 95 });
      
      const config = monitoringService.getConfig();
      expect(config.cpuThreshold).toBe(95);
    });
  });

  describe('getEventEmitter', () => {
    it('should return the event emitter', () => {
      const emitter = monitoringService.getEventEmitter();
      expect(emitter).toBeDefined();
    });
  });

  describe('getHealthCheckManager', () => {
    it('should return the health check manager', () => {
      const healthManager = monitoringService.getHealthCheckManager();
      expect(healthManager).toBeDefined();
    });
  });
});
