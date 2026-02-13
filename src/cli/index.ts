/**
 * TSPM CLI - Command Line Interface
 * A professional CLI for process management using Commander.js
 * Provides commands for process management similar to PM2
 */

import { Command } from 'commander';
import { ConfigLoader, ProcessManager } from '../core';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { DEFAULT_PROCESS_CONFIG, PROCESS_STATE, EXIT_CODES } from '../utils/config/constants';
import type { ProcessConfig } from '../core/types';
import { log } from '../utils/logger';

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
    config: ProcessConfig;
    state: string;
  };
}

// ============================================================================
// File System Helpers
// ============================================================================

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
  } catch {
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
  } catch {
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
function updateProcessStatus(name: string, data: ProcessDaemonStatus[string]): void {
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

// ============================================================================
// CLI Commands
// ============================================================================

/**
 * Start command - Start one or more processes
 */
async function startCommand(
  configFile: string,
  options: {
    name?: string;
    watch?: boolean;
    daemon?: boolean;
    env?: string[];
  }
): Promise<void> {
  // Use default config file if not specified
  const configPath = configFile || 'tspm.yaml';

  log.info(`[TSPM] Loading configuration from: ${configPath}`);

  try {
    const config = await ConfigLoader.load(configPath);
    const manager = new ProcessManager();

    // Determine which processes to start
    const processesToStart = options.name
      ? config.processes.filter(p => p.name === options.name)
      : config.processes;

    if (processesToStart.length === 0) {
      const nameMsg = options.name ? ` with name '${options.name}'` : '';
      log.error(`[TSPM] No process found${nameMsg} in config file: ${configPath}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }

    log.info(`[TSPM] Starting ${processesToStart.length} process(es)...`);

    for (const procConfig of processesToStart) {
      manager.addProcess(procConfig);
    }

    await manager.startAll();

    // Update status for each process
    for (const procConfig of processesToStart) {
      const proc = manager.getProcess(procConfig.name);
      if (proc) {
        const status = proc.getStatus();
        const pid = status.pid ?? 0;
        updateProcessStatus(procConfig.name, {
          pid: pid,
          startedAt: Date.now(),
          config: procConfig,
          state: status.state || PROCESS_STATE.RUNNING,
        });
        log.success(`[TSPM] ✓ Started: ${procConfig.name} (pid: ${pid})`);
      }
    }

    // Save config reference
    ensureTSPMHome();
    writeFileSync(
      join(TSPM_HOME, 'last-config.json'),
      JSON.stringify({ configPath, processes: config.processes.map(p => p.name) })
    );

    if (options.daemon) {
      log.info(`[TSPM] Running in daemon mode`);
      writeDaemonStatus({ pid: process.pid, startedAt: Date.now(), configFile: configPath });
    }

    log.success(`[TSPM] All processes started successfully`);
  } catch (error) {
    log.error(`[TSPM] Failed to start: ${error}`);
    process.exit(EXIT_CODES.PROCESS_START_FAILED);
  }
}

/**
 * Stop command - Stop one or all processes
 */
function stopCommand(options: { all?: boolean; name?: string }): void {
  const status = readProcessStatus();

  if (Object.keys(status).length === 0) {
    log.info('[TSPM] No processes to stop');
    return;
  }

  if (options.all || (!options.name && Object.keys(status).length > 0)) {
    // Stop all processes
    log.info('[TSPM] Stopping all processes...');
    for (const [name, data] of Object.entries(status)) {
      try {
        if (data.pid) {
        process.kill(data.pid, 'SIGTERM');
      }
        removeProcessStatus(name);
        log.success(`[TSPM] ✓ Stopped: ${name}`);
      } catch (e) {
        log.error(`[TSPM] Failed to stop ${name}: ${e}`);
      }
    }
    log.info('[TSPM] All processes stopped');
  } else if (options.name) {
    // Stop specific process
    const data = status[options.name];
    if (data) {
      try {
        if (data.pid) {
          process.kill(data.pid, 'SIGTERM');
        }
        removeProcessStatus(options.name);
        log.success(`[TSPM] ✓ Stopped: ${options.name}`);
      } catch (e) {
        log.error(`[TSPM] Failed to stop ${options.name}: ${e}`);
        process.exit(EXIT_CODES.ERROR);
      }
    } else {
      log.error(`[TSPM] Process not found: ${options.name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
  }
}

/**
 * Restart command - Restart one or all processes
 */
async function restartCommand(
  configFile: string,
  options: { all?: boolean; name?: string }
): Promise<void> {
  // First stop
  stopCommand({ all: true });

  // Then start
  await startCommand(configFile, { name: options.name });
}

/**
 * List command - List all managed processes
 */
function listCommand(): void {
  const status = readProcessStatus();
  const processes = Object.entries(status);

  if (processes.length === 0) {
    log.raw('\n┌─────────────────────────────────────────────────────────────┐');
    log.raw('│                    TSPM Process List                        │');
    log.raw('├─────────────────────────────────────────────────────────────┤');
    log.raw('│  No processes running                                      │');
    log.raw('└─────────────────────────────────────────────────────────────┘\n');
    return;
  }

  log.raw('\n┌─────┬──────────────────────┬─────────────┬────────────┬─────────────┬──────────────┐');
  log.raw('│ id  │ name                 │ mode       │ pid        │ status      │ restarts    │');
  log.raw('├─────┼──────────────────────┼─────────────┼────────────┼─────────────┼──────────────┤');

  let index = 0;
  for (const [name, data] of processes) {
    const pidStr = data.pid?.toString() || '-';
    const statusStr = data.state?.toUpperCase() || 'UNKNOWN';
    const restartStr = '0';

    log.raw(
      `│ ${String(index).padStart(3)} │ ${name.substring(0, 20).padEnd(20)} │ fork        │ ${pidStr.padEnd(10)} │ ${statusStr.padEnd(10)} │ ${restartStr.padEnd(11)} │`
    );
    index++;
  }

  log.raw('└─────┴──────────────────────┴─────────────┴────────────┴─────────────┴──────────────┘');
  log.raw(`\n Total processes: ${processes.length}\n`);
}

/**
 * Logs command - Show logs for a process
 */
function logsCommand(options: { name?: string; lines?: number; raw?: boolean }): void {
  const status = readProcessStatus();
  const logDir = DEFAULT_PROCESS_CONFIG.logDir;
  const numLines = options.lines || 50;

  const processNames = options.name ? [options.name] : Object.keys(status);

  for (const name of processNames) {
    const logPath = join(logDir, `${name}.log`);
    if (existsSync(logPath)) {
      if (!options.raw) {
        log.raw(`\n=== ${name} (last ${numLines} lines) ===`);
      }
      try {
        const content = readFileSync(logPath, 'utf-8');
        const lines = content.split('\n');
        const showLines = lines.slice(-numLines);
        log.raw(showLines.join('\n'));
      } catch (e) {
        log.error(`[TSPM] Failed to read logs for ${name}: ${e}`);
      }
    } else {
      log.info(`[TSPM] No log file found for: ${name}`);
    }
  }
}

/**
 * Describe command - Show detailed info about a process
 */
function describeCommand(name: string): void {
  const status = readProcessStatus();

  if (!name || !status[name]) {
    log.error(`[TSPM] Process not found: ${name}`);
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }

  const proc = status[name];
  const uptime = proc.startedAt ? Math.floor((Date.now() - proc.startedAt) / 1000) : 0;
  const uptimeStr = uptime > 0 ? `${uptime}s` : '-';

  log.raw(`
┌─────────────────────────┬──────────────────────┐
│ field                  │ value                │
├─────────────────────────┼──────────────────────┤
│ name                   │ ${name.padEnd(22)} │
│ pid                    │ ${String(proc.pid).padEnd(22)} │
│ status                 │ ${(proc.state || 'unknown').toUpperCase().padEnd(22)} │
│ mode                   │ fork                 │
│ restarts               │ 0                    │
│ uptime                 │ ${uptimeStr.padEnd(22)} │
│ watch                  │ disabled             │
└─────────────────────────┴──────────────────────┘
  `);
}

/**
 * Delete command - Delete a process from the list
 */
function deleteCommand(options: { all?: boolean; name?: string }): void {
  const status = readProcessStatus();

  if (options.all) {
    // Delete all
    log.info('[TSPM] Deleting all processes...');
    for (const name of Object.keys(status)) {
      removeProcessStatus(name);
      log.success(`[TSPM] ✓ Deleted: ${name}`);
    }
  } else if (options.name) {
    if (status[options.name]) {
      removeProcessStatus(options.name);
      log.success(`[TSPM] ✓ Deleted: ${options.name}`);
    } else {
      log.error(`[TSPM] Process not found: ${options.name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }
  } else {
    log.error('[TSPM] Please specify a process name or use --all');
    process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
  }
}

/**
 * Reload command - Reload process(es)
 */
async function reloadCommand(
  configFile: string,
  options: { all?: boolean; name?: string }
): Promise<void> {
  // Reload is essentially restart but preserving some state
  await restartCommand(configFile, options);
}

import { getProcessStats } from '../utils/stats';

/**
 * Monit command - Real-time monitoring
 */
async function monitCommand(): Promise<void> {
  const status = readProcessStatus();
  const processes = Object.entries(status);

  console.clear();
  log.raw('┌─────────────────────────────────────────────────────────────┐');
  log.raw('│                    TSPM Process Monitor                    │');
  log.raw('├─────────────────────────────────────────────────────────────┤');
  log.raw('│  name                 │ status    │ cpu    │ memory         │');
  log.raw('├───────────────────────┼───────────┼────────┼────────────────┤');

  if (processes.length === 0) {
    log.raw('│  No processes running                                      │');
  } else {
    for (const [name, data] of processes) {
      let cpuStr = '-';
      let memStr = '-';
      let currentState = data.state;

      if (data.pid) {
        const stats = await getProcessStats(data.pid as number);
        if (stats) {
            cpuStr = `${stats.cpu.toFixed(1)}%`;
            memStr = `${(stats.memory / 1024 / 1024).toFixed(1)} MB`;
        } else {
            currentState = 'STOPPED';
        }
      }

      const statusStr = currentState.toUpperCase().padEnd(9);
      log.raw(
        `│ ${name.substring(0, 21).padEnd(21)} │ ${statusStr} │ ${cpuStr.padEnd(6)} │ ${memStr.padEnd(14)} │`
      );
    }
  }

  log.raw('└─────────────────────────────────────────────────────────────┘');
  log.raw(`\nMonitoring ${processes.length} process(es). Press Ctrl+C to exit.`);
}

/**
 * Set up the CLI program using Commander.js
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name('tspm')
    .description('TSPM - TypeScript Process Manager\nA CLI for managing TypeScript/Node.js processes similar to PM2')
    .version('1.0.0')
    .exitOverride((err) => {
      if (err.code === 'commander.help') {
        // Help was requested, exit gracefully
        process.exit(0);
      }
      process.exit(err.exitCode || 1);
    })
    .configureHelp({
      showGlobalOptions: true,
      sortSubcommands: true,
    })
    .showHelpAfterError();

  // Start command
  program
    .command('start')
    .description('Start a process or ecosystem file')
    .option('-c, --config <file>', 'Configuration file path', 'tspm.yaml')
    .option('-n, --name <name>', 'Start only the specified process by name')
    .option('-w, --watch', 'Enable file watching for auto-restart', false)
    .option('-d, --daemon', 'Run in daemon mode (background)', false)
    .option('-e, --env <env...>', 'Environment variables to set')
    .action((options) => startCommand(options.config, options));

  // Stop command
  program
    .command('stop')
    .description('Stop a running process')
    .option('-n, --name <name>', 'Stop only the specified process by name')
    .option('-a, --all', 'Stop all running processes')
    .action((options) => {
      if (!options.name && !options.all) {
        log.error('[TSPM] Please specify a process name with --name or use --all');
        process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
      }
      stopCommand(options);
    });

  // Restart command
  program
    .command('restart')
    .description('Restart a running process')
    .argument('[config-file]', 'Configuration file path (default: tspm.yaml)', 'tspm.yaml')
    .option('-n, --name <name>', 'Restart only the specified process by name')
    .option('-a, --all', 'Restart all processes')
    .action(restartCommand);

  // Reload command
  program
    .command('reload')
    .description('Reload process(es) without downtime (alias for restart)')
    .argument('[config-file]', 'Configuration file path (default: tspm.yaml)', 'tspm.yaml')
    .option('-n, --name <name>', 'Reload only the specified process by name')
    .option('-a, --all', 'Reload all processes')
    .action(reloadCommand);

  // Delete command
  program
    .command('delete')
    .description('Delete a process from the list (stops it first if running)')
    .option('-n, --name <name>', 'Delete the specified process by name')
    .option('-a, --all', 'Delete all processes')
    .action((options) => {
      if (!options.name && !options.all) {
        log.error('[TSPM] Please specify a process name with --name or use --all');
        process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
      }
      deleteCommand(options);
    });

  // List command
  program
    .command('list')
    .alias('ls')
    .description('List all managed processes')
    .action(listCommand);

  // Logs command
  program
    .command('logs')
    .description('Show logs for a process')
    .option('-n, --name <name>', 'Show logs for the specified process')
    .option('-l, --lines <number>', 'Number of lines to show', '50')
    .option('-r, --raw', 'Raw output (no headers)', false)
    .action((options) => {
      logsCommand({
        name: options.name,
        lines: parseInt(options.lines, 10),
        raw: options.raw,
      });
    });

  // Describe command
  program
    .command('describe')
    .alias('desc')
    .description('Show detailed information about a process')
    .argument('<name>', 'Process name')
    .action(describeCommand);

  // Monit command
  program
    .command('monit')
    .description('Real-time process monitoring (experimental)')
    .action(monitCommand);

  // Flush command (clear logs)
  program
    .command('flush')
    .description('Flush all logs')
    .action(() => {
      log.info('[TSPM] Log flushing not yet implemented');
    });

  // Reset command (reset all metrics)
  program
    .command('reset')
    .description('Reset all metrics for a process')
    .option('-n, --name <name>', 'Reset metrics for the specified process')
    .option('-a, --all', 'Reset metrics for all processes')
    .action((options) => {
      console.log('[TSPM] Metrics reset not yet implemented');
    });

  // Cluster command - Show cluster information
  program
    .command('cluster')
    .description('Show cluster information for a process')
    .argument('[name]', 'Process name')
    .action((name) => {
      const status = readProcessStatus();
      
      if (!name) {
        // Show all clusters
        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        console.log('│                    TSPM Clusters                          │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        
        const clusterNames = new Set<string>();
        for (const [procName, data] of Object.entries(status)) {
          // Extract base name from instance name
          const baseName = procName.replace(/-(\d+)$/, '');
          if (baseName !== procName) {
            clusterNames.add(baseName);
          }
        }
        
        if (clusterNames.size === 0) {
          console.log('│  No clusters running                                      │');
        } else {
          let index = 0;
          for (const clusterName of clusterNames) {
            const instances = Object.keys(status).filter(k => k.startsWith(clusterName));
            console.log(
              `│ ${String(index).padStart(3)} │ ${clusterName.substring(0, 20).padEnd(20)} │ ${String(instances.length).padEnd(6)} │ ${'round-robin'.padEnd(12)} │`
            );
            index++;
          }
        }
        
        console.log('└─────────────────────────────────────────────────────────────┘\n');
      } else {
        // Show specific cluster
        const instances = Object.keys(status).filter(k => k.startsWith(name));
        
        if (instances.length === 0) {
          console.error(`[TSPM] No cluster found for: ${name}`);
          process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
        }
        
        console.log(`\n=== Cluster: ${name} ===`);
        console.log(`Instances: ${instances.length}`);
        console.log(`Strategy: round-robin`);
        console.log('\nInstance List:');
        console.log('┌─────┬──────────────────────┬─────────────┬────────────┬──────────────┐');
        console.log('│ id  │ name                 │ pid         │ status     │ restarts    │');
        console.log('├─────┼──────────────────────┼─────────────┼────────────┼──────────────┤');
        
        let idx = 0;
        for (const instName of instances) {
          const data = status[instName];
          const pidStr = data.pid?.toString() || '-';
          const statusStr = (data.state || 'unknown').toUpperCase();
          console.log(
            `│ ${String(idx).padStart(3)} │ ${instName.substring(0, 20).padEnd(20)} │ ${pidStr.padEnd(10)} │ ${statusStr.padEnd(10)} │ 0            │`
          );
          idx++;
        }
        
        console.log('└─────┴──────────────────────┴─────────────┴────────────┴──────────────┘\n');
      }
    });

  // Scale command - Scale cluster instances
  program
    .command('scale')
    .description('Scale cluster instances')
    .argument('<name>', 'Process name to scale')
    .argument('<count>', 'Number of instances')
    .action((name, count) => {
      const instanceCount = parseInt(count, 10);
      
      if (isNaN(instanceCount) || instanceCount < 1) {
        console.error('[TSPM] Invalid instance count');
        process.exit(EXIT_CODES.ERROR);
      }
      
      const status = readProcessStatus();
      
      // Check if process exists
      const instances = Object.keys(status).filter(k => k.startsWith(name));
      if (instances.length === 0) {
        console.error(`[TSPM] Process not found: ${name}`);
        process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
      }
      
      console.log(`[TSPM] Scaling ${name} from ${instances.length} to ${instanceCount} instances...`);
      console.log('[TSPM] Note: Dynamic scaling requires daemon mode. Please restart in daemon mode.');
    });

  // Groups command - Show process groups
  program
    .command('groups')
    .description('Show process groups and namespaces')
    .action(() => {
      const status = readProcessStatus();
      
      // Group by namespace
      const namespaceGroups = new Map<string, string[]>();
      const clusterGroups = new Map<string, string[]>();
      
      for (const [procName, data] of Object.entries(status)) {
        const namespace = data.config?.namespace || 'default';
        const clusterGroup = data.config?.clusterGroup;
        
        if (!namespaceGroups.has(namespace)) {
          namespaceGroups.set(namespace, []);
        }
        namespaceGroups.get(namespace)!.push(procName);
        
        if (clusterGroup) {
          if (!clusterGroups.has(clusterGroup)) {
            clusterGroups.set(clusterGroup, []);
          }
          clusterGroups.get(clusterGroup)!.push(procName);
        }
      }
      
      console.log('\n┌─────────────────────────────────────────────────────────────┐');
      console.log('│                    TSPM Namespaces                         │');
      console.log('├─────────────────────────────────────────────────────────────┤');
      
      if (namespaceGroups.size === 0) {
        console.log('│  No namespaces                                            │');
      } else {
        let index = 0;
        for (const [namespace, procs] of namespaceGroups.entries()) {
          console.log(
            `│ ${String(index).padStart(3)} │ ${namespace.substring(0, 20).padEnd(20)} │ ${String(procs.length).padEnd(10)} │`
          );
          index++;
        }
      }
      
      console.log('└─────────────────────────────────────────────────────────────┘\n');
      
      if (clusterGroups.size > 0) {
        console.log('\n┌─────────────────────────────────────────────────────────────┐');
        console.log('│                    TSPM Cluster Groups                     │');
        console.log('├─────────────────────────────────────────────────────────────┤');
        
        let index = 0;
        for (const [group, procs] of clusterGroups.entries()) {
          console.log(
            `│ ${String(index).padStart(3)} │ ${group.substring(0, 20).padEnd(20)} │ ${String(procs.length).padEnd(10)} │`
          );
          index++;
        }
        
        console.log('└─────────────────────────────────────────────────────────────┘\n');
      }
    });

  return program;
}

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Main CLI entry point
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(argv);
  } catch (error) {
    log.error(`[TSPM] Error: ${error}`);
    process.exit(EXIT_CODES.ERROR);
  }
}

// Run if executed directly
if (import.meta.main) {
  main();
}
