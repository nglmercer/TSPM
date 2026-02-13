/**
 * Process statistics collector
 * Provides CPU and Memory usage for managed processes
 * @module utils/stats
 */

import { spawnSync } from "bun";

export interface ProcessStats {
  cpu: number;
  memory: number; // in bytes
  uptime: number; // in seconds
}

/**
 * Get statistics for a process by PID
 * 
 * @param pid - Process ID
 * @returns Process statistics or null if process not found
 */
export async function getProcessStats(pid: number): Promise<ProcessStats | null> {
  try {
    // Using 'ps' command for cross-platform basic compatibility on Linux/macOS
    // -o %cpu,%mem,rss,etime
    // rss: resident set size (memory)
    // etime: elapsed time since the process was started
    const result = spawnSync({
      cmd: ["ps", "-p", pid.toString(), "-o", "%cpu,rss,etime", "--no-headers"],
    });

    if (result.stdout) {
      const output = result.stdout.toString().trim();
      if (!output) return null;

      const parts = output.split(/\s+/);
      if (parts.length < 3) return null;

      const cpu = parseFloat(parts[0]);
      const memory = parseInt(parts[1]) * 1024; // convert KB to bytes
      const etime = parts[2];

      return {
        cpu,
        memory,
        uptime: parseElapsedTimeToSeconds(etime),
      };
    }
  } catch (e) {
    // console.error(`[TSPM] Error getting stats for PID ${pid}: ${e}`);
  }
  return null;
}

/**
 * Parse ps etime format [[dd-]hh:]mm:ss to seconds
 * 
 * @param etime - Elapsed time string
 * @returns Seconds
 */
function parseElapsedTimeToSeconds(etime: string): number {
  const parts = etime.split("-");
  let days = 0;
  let timeStr = etime;

  if (parts.length > 1) {
    days = parseInt(parts[0]);
    timeStr = parts[1];
  }

  const timeParts = timeStr.split(":").map(Number);
  let seconds = days * 86400;

  if (timeParts.length === 3) {
    // hh:mm:ss
    seconds += timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
  } else if (timeParts.length === 2) {
    // mm:ss
    seconds += timeParts[0] * 60 + timeParts[1];
  }

  return seconds;
}
