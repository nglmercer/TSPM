import { writeFileSync } from 'fs';
import { join } from 'path';
import { ConfigLoader, ProcessManager } from '../../core';
import { EXIT_CODES, PROCESS_STATE, APP_CONSTANTS } from '../../utils/config/constants';
import { log, configureLogger } from '../../utils/logger';
import { startApi } from '../../utils/api';
import { TSPM_HOME } from '../state/constants';
import { ensureTSPMHome, updateProcessStatus, writeDaemonStatus } from '../state/status';

export async function startCommand(
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

  log.info(`${APP_CONSTANTS.LOG_PREFIX} Loading configuration from: ${configPath}`);

  try {
    const config = await ConfigLoader.load(configPath);

    // Apply global logging config if requested
    if (config.structuredLogging) {
      configureLogger({ json: true });
    }

    const manager = new ProcessManager({
      webhooks: config.webhooks
    });

    // Determine which processes to start
    const processesToStart = options.name
      ? config.processes.filter(p => p.name === options.name)
      : config.processes;

    if (processesToStart.length === 0) {
      const nameMsg = options.name ? ` with name '${options.name}'` : '';
      log.error(`${APP_CONSTANTS.LOG_PREFIX} No process found${nameMsg} in config file: ${configPath}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }

    log.info(`${APP_CONSTANTS.LOG_PREFIX} Starting ${processesToStart.length} process(es)...`);

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
        log.success(`${APP_CONSTANTS.LOG_PREFIX} ✓ Started: ${procConfig.name} (pid: ${pid})`);
      }
    }

    // Save config reference
    ensureTSPMHome();
    writeFileSync(
      join(TSPM_HOME, 'last-config.json'),
      JSON.stringify({ configPath, processes: config.processes.map(p => p.name) })
    );

    if (options.daemon) {
      log.info(`${APP_CONSTANTS.LOG_PREFIX} Running in daemon mode`);
      writeDaemonStatus({ pid: process.pid, startedAt: Date.now(), configFile: configPath });
    }

    // Start API if enabled
    if (config.api?.enabled !== false) {
        startApi(manager, config.api || {});
    }

    log.success(`${APP_CONSTANTS.LOG_PREFIX} All processes started successfully`);
  } catch (error) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to start: ${error}`);
    process.exit(EXIT_CODES.PROCESS_START_FAILED);
  }
}
