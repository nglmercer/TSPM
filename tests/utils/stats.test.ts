import { expect, test, describe } from "bun:test";
import { getProcessStats, type ProcessStats } from "../../src/utils/stats";

describe("getProcessStats", () => {
  test("should return null for non-existent PID", async () => {
    const stats = await getProcessStats(999999999);
    expect(stats).toBeNull();
  });

  test("should return stats for current process", async () => {
    const stats = await getProcessStats(process.pid);
    expect(stats).not.toBeNull();
    expect(stats!.cpu).toBeDefined();
    expect(stats!.memory).toBeGreaterThan(0);
    expect(stats!.uptime).toBeGreaterThanOrEqual(0);
  });

  test("should return stats with cpu and memory", async () => {
    const stats = await getProcessStats(process.pid);
    expect(stats).not.toBeNull();
    expect(typeof stats!.cpu).toBe("number");
    expect(typeof stats!.memory).toBe("number");
    expect(typeof stats!.uptime).toBe("number");
  });
});

describe("ProcessStats type", () => {
  test("should have required properties", () => {
    const stats: ProcessStats = {
      cpu: 10.5,
      memory: 1024000,
      uptime: 3600,
    };
    
    expect(stats.cpu).toBe(10.5);
    expect(stats.memory).toBe(1024000);
    expect(stats.uptime).toBe(3600);
  });
});
