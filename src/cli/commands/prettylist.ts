import { log } from '../../utils/logger';
import { readProcessStatus } from '../state/status';
import { EXIT_CODES, APP_CONSTANTS, PROCESS_STATE } from '../../utils/config/constants';
import type { ProcessConfig } from '../../core/types';

/**
 * Process information for pretty printing
 */
interface PrettyProcessInfo {
  name: string;
  pid: number | null;
  pm_id: number;
  status: string;
  mode: string;
  restarts: number;
  uptime: string;
  memory: string;
  cpu: string;
  user: string;
  watching: boolean | string[];
  created_at: string;
  unstable_restarts: number;
  restart_time: string;
  exec_mode: string;
  instances: number;
  script: string;
  cwd: string;
  namespace: string;
  version: string;
  node_version: string;
  bun_version: string;
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(startedAt: number | undefined): string {
  if (!startedAt) return '0s';
  
  const uptimeMs = Date.now() - startedAt;
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format memory in human-readable format
 */
function formatMemory(bytes: number): string {
  if (bytes === 0) return '0B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)}${units[i]}`;
}

/**
 * Prettylist command - Pretty-printed JSON process list
 * 
 * This command outputs a detailed, formatted JSON representation
 * of all processes, similar to PM2's prettylist command.
 */
export function prettylistCommand(options: { name?: string }): void {
  const status = readProcessStatus();
  const processes = Object.entries(status);

  if (processes.length === 0) {
    log.info('No processes found');
    return;
  }

  // Filter by name if specified
  const filteredProcesses = options.name
    ? processes.filter(([name]) => name === options.name)
    : processes;

  if (options.name && filteredProcesses.length === 0) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Process not found: ${options.name}`);
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }

  const prettyList: PrettyProcessInfo[] = filteredProcesses.map(([name, data], index) => {
    const config = data.config as ProcessConfig || {};
    
    return {
      name,
      pid: data.pid || null,
      pm_id: index,
      status: data.state || PROCESS_STATE.STOPPED,
      mode: config.instances && config.instances > 1 ? 'cluster_mode' : 'fork_mode',
      restarts: data.restarts || 0,
      uptime: formatUptime(data.startedAt),
      memory: formatMemory(0), // Would need live monitoring for actual value
      cpu: '0%', // Would need live monitoring for actual value
      user: process.env.USER || 'unknown',
      watching: config.watch || false,
      created_at: data.startedAt ? new Date(data.startedAt).toISOString() : 'N/A',
      unstable_restarts: data.restarts || 0,
      restart_time: data.startedAt ? new Date(data.startedAt).toISOString() : 'N/A',
      exec_mode: config.instances && config.instances > 1 ? 'cluster' : 'fork',
      instances: config.instances || 1,
      script: config.script || 'N/A',
      cwd: config.cwd || process.cwd(),
      namespace: config.namespace || 'default',
      version: '1.0.0',
      node_version: process.version,
      bun_version: typeof Bun !== 'undefined' ? Bun.version : 'N/A',
    };
  });

  // Output pretty-printed JSON
  console.log(JSON.stringify(prettyList, null, 2));
}
