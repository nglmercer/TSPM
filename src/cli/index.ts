/**
 * TSPM CLI - Command Line Interface
 * Provides commands for process management similar to PM2
 */

import { parseArgs } from 'util';
import { ConfigLoader, ProcessManager, ProcessStatus } from '../core';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { DEFAULT_PROCESS_CONFIG, PROCESS_STATE, EXIT_CODES } from '../utils/config/constants';
import type { TSPMConfig } from '../utils/config/schema';

// CLI State directory
const TSPM_HOME = process.env.TSPM_HOME || join(process.env.HOME || '.', '.tspm');
const DAEMON_PID_FILE = join(TSPM_HOME, 'daemon.pid');
const STATUS_FILE = join(TSPM_HOME, 'status.json');

interface DaemonStatus {
  pid: number;
  startedAt: number;
  configFile: string;
}

interface ProcessDaemonStatus {
  [key: string]: {
    pid: number;
    startedAt: number;
    config: any;
    state: string;
  };
}

/**
 * Ensure TSPM home directory exists
 */
function ensureTSPMHome(): void {
  if (!existsSync(TSPM_HOME)) {
    mkdirSync(TSPM_HOME, { recursive: true });
  }
}

/**
 * Read daemon status
 */
function readDaemonStatus(): DaemonStatus | null {
  try {
    if (existsSync(DAEMON_PID_FILE)) {
      const content = readFileSync(DAEMON_PID_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    // Ignore errors
  }
  return null;
}

/**
 * Write daemon status
 */
function writeDaemonStatus(status: DaemonStatus): void {
  ensureTSPMHome();
  writeFileSync(DAEMON_PID_FILE, JSON.stringify(status, null, 2));
}

/**
 * Read process status file
 */
function readProcessStatus(): ProcessDaemonStatus {
  try {
    if (existsSync(STATUS_FILE)) {
      return JSON.parse(readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch (e) {
    // Ignore errors
  }
  return {};
}

/**
 * Write process status file
 */
function writeProcessStatus(status: ProcessDaemonStatus): void {
  ensureTSPMHome();
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

/**
 * Update process status in daemon
 */
function updateProcessStatus(name: string, data: any): void {
  const status = readProcessStatus();
  status[name] = data;
  writeProcessStatus(status);
}

/**
 * Remove process from status file
 */
function removeProcessStatus(name: string): void {
  const status = readProcessStatus();
  delete status[name];
  writeProcessStatus(status);
}

/**
 * Start command - Start a process
 */
async function cmdStart(args: string[]): Promise<void> {
  const { values, positionals } = parseArgs({
    args: args,
    options: {
      config: { type: 'string', short: 'c' },
      name: { type: 'string', short: 'n' },
      watch: { type: 'boolean', short: 'w', default: false },
      daemon: { type: 'boolean', short: 'd', default: false },
      env: { type: 'string', multiple: true },
    },
    allowPositionals: true,
  });

  // Use positional argument or --config option, default to tspm.yaml
  const configPath = (positionals[0] as string) || (values.config as string) || 'tspm.yaml';
  const processName = values.name as string | undefined;

  try {
    const config = await ConfigLoader.load(configPath);
    const manager = new ProcessManager();
    
    // Determine which processes to start
    const processesToStart = processName 
      ? config.processes.filter(p => p.name === processName)
      : config.processes;

    if (processesToStart.length === 0) {
      console.error(`[TSPM] No process found: ${processName}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }

    for (const procConfig of processesToStart) {
      manager.addProcess(procConfig);
    }
    
    await manager.startAll();
    
    // Update status for each process
    for (const procConfig of processesToStart) {
      const proc = manager.getProcess(procConfig.name);
      if (proc) {
        const status = proc.getStatus();
        updateProcessStatus(procConfig.name, {
          pid: status.pid,
          startedAt: Date.now(),
          config: procConfig,
          state: status.state || PROCESS_STATE.RUNNING,
        });
        console.log(`[TSPM] Started: ${procConfig.name} (pid: ${status.pid})`);
      }
    }

    // Save config reference
    if (!existsSync(TSPM_HOME)) {
      mkdirSync(TSPM_HOME, { recursive: true });
    }
    writeFileSync(join(TSPM_HOME, 'last-config.json'), JSON.stringify({ configPath, processes: config.processes.map(p => p.name) }));

    if (values.daemon) {
      console.log(`[TSPM] Running in daemon mode`);
      writeDaemonStatus({ pid: process.pid, startedAt: Date.now(), configFile: configPath });
    }

  } catch (error) {
    console.error(`[TSPM] Failed to start: ${error}`);
    process.exit(EXIT_CODES.PROCESS_START_FAILED);
  }
}

/**
 * Stop command - Stop a process
 */
async function cmdStop(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args: args,
    options: {
      all: { type: 'boolean', short: 'a', default: false },
    },
  });

  const status = readProcessStatus();
  
  if (values.all || Object.keys(status).length === 0) {
    // Stop all processes
    const allStatus = readProcessStatus();
    for (const name of Object.keys(allStatus)) {
      try {
        process.kill(allStatus[name].pid, 'SIGTERM');
        removeProcessStatus(name);
        console.log(`[TSPM] Stopped: ${name}`);
      } catch (e) {
        console.error(`[TSPM] Failed to stop ${name}: ${e}`);
      }
    }
    console.log('[TSPM] All processes stopped');
  } else {
    // Stop specific process
    for (const name of Object.keys(status)) {
      try {
        process.kill(status[name].pid, 'SIGTERM');
        removeProcessStatus(name);
        console.log(`[TSPM] Stopped: ${name}`);
      } catch (e) {
        console.error(`[TSPM] Failed to stop ${name}: ${e}`);
      }
    }
  }
}

/**
 * Restart command - Restart a process
 */
async function cmdRestart(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args: args,
    options: {
      all: { type: 'boolean', short: 'a', default: false },
    },
  });

  // Stop first
  await cmdStop(args);
  
  // Then start
  await cmdStart(args);
}

/**
 * List command - List all managed processes
 */
function cmdList(): void {
  const status = readProcessStatus();
  
  console.log('\n┌─────┬──────────────────────┬─────────────┬────────────┬─────────────┬──────────────┐');
  console.log('│ id  │ name                 │ mode       │ pid        │ status      │ restarts    │');
  console.log('├─────┼──────────────────────┼─────────────┼────────────┼─────────────┼──────────────┤');
  
  let index = 0;
  for (const [name, data] of Object.entries(status)) {
    const pidStr = data.pid?.toString() || '-';
    const statusStr = data.state?.toUpperCase() || 'UNKNOWN';
    const restartStr = '0';
    
    console.log(`│ ${String(index).padStart(3)} │ ${name.substring(0, 20).padEnd(20)} │ fork        │ ${pidStr.padEnd(10)} │ ${statusStr.padEnd(10)} │ ${restartStr.padEnd(11)} │`);
    index++;
  }
  
  console.log('└─────┴──────────────────────┴─────────────┴────────────┴─────────────┴──────────────┘');
  console.log(`\n Total processes: ${Object.keys(status).length}\n`);
}

/**
 * Logs command - Show logs for a process
 */
function cmdLogs(args: string[]): void {
  const { values } = parseArgs({
    args: args,
    options: {
      lines: { type: 'string', short: 'n', default: '50' },
      raw: { type: 'boolean', short: 'r', default: false },
    },
  });

  const status = readProcessStatus();
  const logDir = DEFAULT_PROCESS_CONFIG.logDir;
  
  for (const name of Object.keys(status)) {
    const logPath = join(logDir, `${name}.log`);
    if (existsSync(logPath)) {
      console.log(`\n=== ${name} ===`);
      try {
        const content = readFileSync(logPath, 'utf-8');
        const lines = content.split('\n');
        const numLines = parseInt(values.lines as string) || 50;
        const showLines = lines.slice(-numLines);
        console.log(showLines.join('\n'));
      } catch (e) {
        console.error(`[TSPM] Failed to read logs for ${name}: ${e}`);
      }
    }
  }
}

/**
 * Describe command - Show detailed info about a process
 */
function cmdDescribe(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args: args,
    options: {
      name: { type: 'string', short: 'n' },
    },
  });

  const name = values.name as string;
  const status = readProcessStatus();
  
  if (!name || !status[name]) {
    console.error(`[TSPM] Process not found: ${name}`);
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }

  const proc = status[name];
  console.log(`
┌─────────────────────────┬──────────────────────┐
│ field                  │ value                │
├─────────────────────────┼──────────────────────┤
│ name                   │ ${name.padEnd(22)} │
│ pid                    │ ${String(proc.pid).padEnd(22)} │
│ status                 │ ${(proc.state || 'unknown').toUpperCase().padEnd(22)} │
│ mode                   │ fork                 │
│ restarts               │ 0                    │
│ uptime                 │ ${proc.startedAt ? Math.floor((Date.now() - proc.startedAt) / 1000) + 's' : '-'.padEnd(22)} │
│ watch                  │ disabled             │
└─────────────────────────┴──────────────────────┘
  `);
  
  return Promise.resolve();
}

/**
 * Delete command - Delete a process from the list
 */
function cmdDelete(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args: args,
    options: {
      all: { type: 'boolean', short: 'a', default: false },
    },
  });

  if (values.all) {
    // Delete all
    const status = readProcessStatus();
    for (const name of Object.keys(status)) {
      removeProcessStatus(name);
      console.log(`[TSPM] Deleted: ${name}`);
    }
  } else {
    // Delete by name (first argument after delete)
    const name = args[0];
    if (name && readProcessStatus()[name]) {
      removeProcessStatus(name);
      console.log(`[TSPM] Deleted: ${name}`);
    } else {
      console.error('[TSPM] Please specify a process name or use --all');
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
  }
  
  return Promise.resolve();
}

/**
 * Reload command - Reload process(es)
 */
async function cmdReload(args: string[]): Promise<void> {
  // Reload is essentially restart but preserving some state
  await cmdRestart(args);
}

/**
 * Monit command - Real-time monitoring (simplified)
 */
function cmdMonit(): void {
  const status = readProcessStatus();
  
  console.clear();
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                    TSPM Process Monitor                    │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│  name                 │ status    │ cpu    │ memory         │');
  console.log('├───────────────────────┼───────────┼────────┼────────────────┤');
  
  for (const [name, data] of Object.entries(status)) {
    const statusStr = (data.state || 'unknown').toUpperCase().padEnd(9);
    console.log(`│ ${name.substring(0, 21).padEnd(21)} │ ${statusStr} │ -       │ -              │`);
  }
  
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log(`\nMonitoring ${Object.keys(status).length} process(es). Press Ctrl+C to exit.`);
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
TSPM - TypeScript Process Manager

Usage: tspm <command> [options]

Commands:
  start <file>         Start a process/ecosystem file
  stop                 Stop a process (or all if --all)
  restart              Restart a process (or all if --all)
  reload               Reload process(es) without downtime
  delete               Delete a process from the list
  list                 List all managed processes
  logs                 Show logs for a process
  monit                Real-time process monitoring
  describe             Show detailed process information
  help                 Show this help message

Options:
  -c, --config <file>  Configuration file path
  -n, --name <name>    Process name
  -a, --all            Apply to all processes
  -w, --watch          Enable file watching
  -d, --daemon         Run in daemon mode
  -r, --raw            Raw output for logs
  --lines <n>          Number of log lines to show

Examples:
  tspm start tspm.yaml
  tspm start tspm.yaml --name my-service
  tspm stop --all
  tspm list
  tspm logs --lines 100
  tspm monit
  tspm describe --name my-service
`);
}

/**
 * Main CLI entry point
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const command = argv[0] || 'help';
  
  const commands: Record<string, (args: string[]) => Promise<void> | void> = {
    start: cmdStart,
    stop: cmdStop,
    restart: cmdRestart,
    reload: cmdReload,
    delete: cmdDelete,
    list: cmdList,
    logs: cmdLogs,
    monit: cmdMonit,
    describe: cmdDescribe,
    help: printHelp,
  };

  const cmd = commands[command];
  
  if (!cmd) {
    console.error(`[TSPM] Unknown command: ${command}`);
    printHelp();
    process.exit(EXIT_CODES.ERROR);
  }

  try {
    const args = argv.slice(1);
    await cmd(args);
  } catch (error) {
    console.error(`[TSPM] Error: ${error}`);
    process.exit(EXIT_CODES.ERROR);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
