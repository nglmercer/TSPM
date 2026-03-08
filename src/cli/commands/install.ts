import { ConfigLoader, ManagedProcess } from '../../core';
import { EXIT_CODES, APP_CONSTANTS } from '../../utils/config/constants';
import { log } from '../../utils/logger';

export interface InstallCommandOptions {
  name: string;
  config?: string;
}

/**
 * Install command - Install dependencies for a process
 */
export async function installCommand(options: InstallCommandOptions): Promise<void> {
  const configPath = options.config || 'tspm.yaml';
  const name = options.name;

  try {
    const config = await ConfigLoader.load(configPath);
    const procConfig = config.processes.find(p => p.name === name);

    if (!procConfig) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Process not found: ${name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }

    if (!procConfig.install) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} No install script defined for process: ${name}`);
      process.exit(EXIT_CODES.ERROR);
    }

    log.info(`${APP_CONSTANTS.LOG_PREFIX} Running install script for ${name}...`);
    
    const managed = new ManagedProcess(procConfig);
    const success = await managed.runScript('install', procConfig.install);

    if (success) {
      log.success(`${APP_CONSTANTS.LOG_PREFIX} Install completed successfully for ${name}`);
    } else {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Install failed for ${name}`);
      process.exit(EXIT_CODES.ERROR);
    }
  } catch (error) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to run install: ${error}`);
    process.exit(EXIT_CODES.ERROR);
  }
}
