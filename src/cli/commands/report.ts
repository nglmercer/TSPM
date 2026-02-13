import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { platform, arch, cpus, freemem, totalmem, uptime, hostname, type, release, loadavg, networkInterfaces, homedir, tmpdir } from 'os';
import { execSync } from 'child_process';
import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';
import { TSPM_HOME, STATUS_FILE, DUMP_FILE, DAEMON_PID_FILE } from '../state/constants';
import { APP_CONSTANTS, PROCESS_STATE } from '../../utils/config/constants';

/**
 * Diagnostic report interface
 */
interface DiagnosticReport {
  timestamp: string;
  tspm: {
    version: string;
    home: string;
    status_file: string;
    dump_file: string;
    daemon_pid_file: string;
    status_file_exists: boolean;
    dump_file_exists: boolean;
    daemon_pid_file_exists: boolean;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    type: string;
    release: string;
    uptime: number;
    loadavg: number[];
    total_memory: number;
    free_memory: number;
    used_memory: number;
    memory_usage_percent: number;
    cpu_count: number;
    cpu_model: string;
    home_dir: string;
    temp_dir: string;
    network_interfaces: string[];
  };
  runtime: {
    node_version: string;
    bun_version: string | null;
    process_pid: number;
    process_cwd: string;
    process_uptime: number;
    process_memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  processes: {
    total: number;
    running: number;
    stopped: number;
    errored: number;
    list: Array<{
      name: string;
      pid: number | null;
      status: string;
      restarts: number;
      uptime: string;
      script: string;
    }>;
  };
  daemon: {
    running: boolean;
    pid: number | null;
    started_at: string | null;
  };
  environment: {
    path: string;
    user: string;
    shell: string;
    tspm_home: string;
  };
}

/**
 * Format bytes to human-readable
 */
function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

/**
 * Report command - Generate diagnostic report
 * 
 * This command generates a comprehensive diagnostic report
 * useful for debugging and troubleshooting issues.
 */
export function reportCommand(options: { output?: string }): void {
  log.info(`${APP_CONSTANTS.LOG_PREFIX} Generating diagnostic report...`);

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    tspm: getTSPMInfo(),
    system: getSystemInfo(),
    runtime: getRuntimeInfo(),
    processes: getProcessInfo(),
    daemon: getDaemonInfo(),
    environment: getEnvironmentInfo(),
  };

  const output = JSON.stringify(report, null, 2);

  if (options.output) {
    // Write to file
    const outputPath = join(process.cwd(), options.output);
    const { writeFileSync } = require('fs');
    writeFileSync(outputPath, output);
    log.success(`${APP_CONSTANTS.LOG_PREFIX} Report saved to: ${outputPath}`);
  } else {
    // Print to stdout
    console.log(output);
  }
}

/**
 * Get TSPM information
 */
function getTSPMInfo(): DiagnosticReport['tspm'] {
  return {
    version: '1.0.0',
    home: TSPM_HOME,
    status_file: STATUS_FILE,
    dump_file: DUMP_FILE,
    daemon_pid_file: DAEMON_PID_FILE,
    status_file_exists: existsSync(STATUS_FILE),
    dump_file_exists: existsSync(DUMP_FILE),
    daemon_pid_file_exists: existsSync(DAEMON_PID_FILE),
  };
}

/**
 * Get system information
 */
function getSystemInfo(): DiagnosticReport['system'] {
  const totalMem = totalmem();
  const freeMem = freemem();
  const usedMem = totalMem - freeMem;
  const cpuList = cpus();
  
  // Get network interface names
  const interfaces = networkInterfaces();
  const interfaceNames = Object.keys(interfaces);

  return {
    platform: platform(),
    arch: arch(),
    hostname: hostname(),
    type: type(),
    release: release(),
    uptime: Math.floor(uptime()),
    loadavg: loadavg(),
    total_memory: totalMem,
    free_memory: freeMem,
    used_memory: usedMem,
    memory_usage_percent: Math.round((usedMem / totalMem) * 100),
    cpu_count: cpuList.length,
    cpu_model: cpuList[0]?.model || 'Unknown',
    home_dir: homedir(),
    temp_dir: tmpdir(),
    network_interfaces: interfaceNames,
  };
}

/**
 * Get runtime information
 */
function getRuntimeInfo(): DiagnosticReport['runtime'] {
  const memUsage = process.memoryUsage();
  
  // Check if Bun is available
  let bunVersion: string | null = null;
  try {
    bunVersion = (globalThis as any).Bun?.version || null;
  } catch {
    // Bun not available
  }

  return {
    node_version: process.version,
    bun_version: bunVersion,
    process_pid: process.pid,
    process_cwd: process.cwd(),
    process_uptime: Math.floor(process.uptime()),
    process_memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
    },
  };
}

/**
 * Get process information
 */
function getProcessInfo(): DiagnosticReport['processes'] {
  const status = readProcessStatus();
  const processList = Object.entries(status);
  
  let running = 0;
  let stopped = 0;
  let errored = 0;

  const list = processList.map(([name, data]) => {
    const state = data.state || PROCESS_STATE.STOPPED;
    
    if (state === PROCESS_STATE.RUNNING) running++;
    else if (state === PROCESS_STATE.STOPPED) stopped++;
    else if (state === PROCESS_STATE.ERRORED) errored++;

    const uptimeMs = data.startedAt ? Date.now() - data.startedAt : 0;
    
    return {
      name,
      pid: data.pid || null,
      status: state,
      restarts: data.restarts || 0,
      uptime: formatUptime(uptimeMs / 1000),
      script: data.config?.script || 'N/A',
    };
  });

  return {
    total: processList.length,
    running,
    stopped,
    errored,
    list,
  };
}

/**
 * Get daemon information
 */
function getDaemonInfo(): DiagnosticReport['daemon'] {
  if (!existsSync(DAEMON_PID_FILE)) {
    return {
      running: false,
      pid: null,
      started_at: null,
    };
  }

  try {
    const content = readFileSync(DAEMON_PID_FILE, 'utf-8');
    const data = JSON.parse(content);
    
    // Check if process is still running
    let running = false;
    try {
      process.kill(data.pid, 0);
      running = true;
    } catch {
      // Process not running
    }

    return {
      running,
      pid: data.pid,
      started_at: data.startedAt ? new Date(data.startedAt).toISOString() : null,
    };
  } catch {
    return {
      running: false,
      pid: null,
      started_at: null,
    };
  }
}

/**
 * Get environment information
 */
function getEnvironmentInfo(): DiagnosticReport['environment'] {
  return {
    path: process.env.PATH || '',
    user: process.env.USER || process.env.USERNAME || 'unknown',
    shell: process.env.SHELL || 'unknown',
    tspm_home: process.env.TSPM_HOME || TSPM_HOME,
  };
}
