import { ConfigLoader, ManagedProcess } from '../../core';
import { EXIT_CODES, APP_CONSTANTS } from '../../utils/config/constants';
import { log } from '../../utils/logger';

export interface BuildCommandOptions {
  name: string;
  config?: string;
}

/**
 * Build command - Build a process
 */
export async function buildCommand(options: BuildCommandOptions): Promise<void> {
  const configPath = options.config || 'tspm.yaml';
  const name = options.name;

  try {
    const config = await ConfigLoader.load(configPath);
    const procConfig = config.processes.find(p => p.name === name);

    if (!procConfig) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Process not found: ${name}`);
      process.exit(EXIT_CODES.PROCESS_NOT_FOUND);
    }

    if (!procConfig.build) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} No build script defined for process: ${name}`);
      process.exit(EXIT_CODES.ERROR);
    }

    log.info(`${APP_CONSTANTS.LOG_PREFIX} Running build script for ${name}...`);
    
    const managed = new ManagedProcess(procConfig);
    const success = await managed.runScript('build', procConfig.build);

    if (success) {
      log.success(`${APP_CONSTANTS.LOG_PREFIX} Build completed successfully for ${name}`);
    } else {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Build failed for ${name}`);
      process.exit(EXIT_CODES.ERROR);
    }
  } catch (error) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to run build: ${error}`);
    process.exit(EXIT_CODES.ERROR);
  }
}
