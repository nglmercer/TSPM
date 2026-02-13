import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { platform, homedir } from 'os';
import { execSync } from 'child_process';
import { ProcessManager } from '../../core';
import { EXIT_CODES, APP_CONSTANTS, PROCESS_STATE } from '../../utils/config/constants';
import { log, configureLogger } from '../../utils/logger';
import { startApi } from '../../utils/api';
import { TSPM_HOME, STATUS_FILE, DUMP_FILE, STARTUP_DIR, DAEMON_PID_FILE } from '../state/constants';
import { readProcessStatus, ensureTSPMHome, writeDaemonStatus, updateProcessStatus } from '../state/status';
import type { ProcessConfig } from '../../core/types';

/**
 * Save current process list to dump file
 */
export async function saveCommand(): Promise<void> {
  log.info(`${APP_CONSTANTS.LOG_PREFIX} Saving current process list...`);
  
  ensureTSPMHome();
  
  try {
    if (!existsSync(STATUS_FILE)) {
      log.warn(`${APP_CONSTANTS.LOG_PREFIX} No running processes found to save.`);
      return;
    }
    
    // Read status file which contains full process info including config
    const content = readFileSync(STATUS_FILE, 'utf-8');
    writeFileSync(DUMP_FILE, content);
    
    log.success(`${APP_CONSTANTS.LOG_PREFIX} Successfully saved process list to ${DUMP_FILE}`);
  } catch (error: any) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to save process list: ${error.message}`);
    process.exit(EXIT_CODES.ERROR);
  }
}

/**
 * Resurrect processes from dump file
 */
export async function resurrectCommand(): Promise<void> {
  log.info(`${APP_CONSTANTS.LOG_PREFIX} Resurrecting processes...`);
  
  try {
    if (!existsSync(DUMP_FILE)) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} No dump file found at ${DUMP_FILE}`);
      log.info(`${APP_CONSTANTS.LOG_PREFIX} Run 'tspm save' to create a dump file.`);
      process.exit(EXIT_CODES.ERROR);
    }
    
    const content = readFileSync(DUMP_FILE, 'utf-8');
    const dump = JSON.parse(content);
    const processes = Object.values(dump).map((entry: any) => entry.config) as ProcessConfig[];
    
    if (processes.length === 0) {
      log.warn(`${APP_CONSTANTS.LOG_PREFIX} No processes found in dump file.`);
      return;
    }
    
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Restoring ${processes.length} process(es)...`);
    
    // Initialize ProcessManager (acts as daemon)
    const manager = new ProcessManager();
    
    // Configure logger (using first process config or default)
    configureLogger({ json: false }); // Default to standard logging
    
    for (const config of processes) {
      manager.addProcess(config);
    }
    
    await manager.startAll();
    
    // Save status
    ensureTSPMHome();
    writeDaemonStatus({ 
      pid: process.pid, 
      startedAt: Date.now(), 
      configFile: 'resurrect' 
    });
    
    // Update process status
    for (const config of processes) {
      const proc = manager.getProcess(config.name);
      if (proc) {
        const status = proc.getStatus();
        updateProcessStatus(config.name, {
          pid: status.pid || 0,
          startedAt: Date.now(),
          config: config,
          state: status.state || PROCESS_STATE.RUNNING,
          restarts: 0,
          uptime: 0,
        });
      }
    }
    
    // Start API
    // Note: We need a default API config or extract it from dump if available
    // For now, use defaults
    startApi(manager, { enabled: true, port: 3000 });
    
    log.success(`${APP_CONSTANTS.LOG_PREFIX} Processes resurrected successfully`);
    
    // Keep process alive
    // This function is intended to run as the daemon, so it shouldn't exit
    
  } catch (error: any) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to resurrect processes: ${error.message}`);
    process.exit(EXIT_CODES.ERROR);
  }
}

/**
 * Generate startup script
 */
export async function startupCommand(options: { system: string, user?: string }): Promise<void> {
  const system = options.system || 'systemd';
  const currentUser = options.user || process.env.USER || 'root';
  const home = process.env.HOME || homedir();
  
  log.info(`${APP_CONSTANTS.LOG_PREFIX} Generating startup script for ${system}...`);
  
  if (platform() !== 'linux') {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Startup scripts are only supported on Linux (systemd) for now.`);
    process.exit(EXIT_CODES.ERROR);
  }
  
  // Create startup directory
  if (!existsSync(STARTUP_DIR)) {
    mkdirSync(STARTUP_DIR, { recursive: true });
  }
  
  // Locate bun executable
  let bunPath: string;
  try {
    bunPath = execSync('which bun').toString().trim();
  } catch {
    bunPath = '/usr/local/bin/bun'; // Fallback
    log.warn(`${APP_CONSTANTS.LOG_PREFIX} Could not find 'bun' in PATH, using fallback: ${bunPath}`);
  }
  
  // Get script path
  // Assuming we are running inside built JS or TS source
  const scriptPath = resolveScriptPath();
  
  const serviceName = 'tspm';
  const serviceFile = `/etc/systemd/system/${serviceName}.service`;
  
  const unitFileContent = `[Unit]
Description=TSPM Process Manager
Documentation=https://github.com/tspm/tspm
After=network.target

[Service]
Type=simple
User=${currentUser}
Environment=PATH=/usr/bin:/usr/local/bin:${process.env.PATH}
Environment=TSPM_HOME=${TSPM_HOME}
ExecStart=${bunPath} ${scriptPath} resurrect
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
`;

  log.info(`${APP_CONSTANTS.LOG_PREFIX} Generated service file content:`);
  console.log(unitFileContent);
  log.info(`${APP_CONSTANTS.LOG_PREFIX} ----------------------------------------------------`);
  
  // If running as root, install it
  if (process.getuid && process.getuid() === 0) {
    try {
      writeFileSync(serviceFile, unitFileContent);
      log.success(`${APP_CONSTANTS.LOG_PREFIX} Written systemd service file to ${serviceFile}`);
      
      execSync('systemctl daemon-reload');
      execSync(`systemctl enable ${serviceName}`);
      execSync(`systemctl start ${serviceName}`);
      
      log.success(`${APP_CONSTANTS.LOG_PREFIX} Systemd service enabled and started.`);
      
      // Save startup info
      writeFileSync(join(STARTUP_DIR, 'startup.json'), JSON.stringify({
        system,
        user: currentUser,
        path: serviceFile,
        timestamp: Date.now()
      }));
      
    } catch (error: any) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to install startup script: ${error.message}`);
    }
  } else {
    log.warn(`${APP_CONSTANTS.LOG_PREFIX} To setup the startup script, copy/paste the following command:`);
    console.log(`sudo bun ${scriptPath} startup systemd -u ${currentUser}`);
  }
}

/**
 * Remove startup script
 */
export async function unstartupCommand(): Promise<void> {
  const serviceFile = '/etc/systemd/system/tspm.service';
  
  if (process.getuid && process.getuid() !== 0) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} You must run this command as root.`);
    process.exit(EXIT_CODES.PERMISSION_DENIED);
  }
  
  try {
    if (existsSync(serviceFile)) {
      execSync('systemctl stop tspm');
      execSync('systemctl disable tspm');
      unlinkSync(serviceFile);
      execSync('systemctl daemon-reload');
      log.success(`${APP_CONSTANTS.LOG_PREFIX} Removed systemd service.`);
    } else {
      log.warn(`${APP_CONSTANTS.LOG_PREFIX} Systemd service file not found.`);
    }
    
    // Remove startup info
    const startupInfoFile = join(STARTUP_DIR, 'startup.json');
    if (existsSync(startupInfoFile)) {
      unlinkSync(startupInfoFile);
    }
  } catch (error: any) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to remove startup script: ${error.message}`);
  }
}

/**
 * Helper to resolve the script path being executed
 */
function resolveScriptPath(): string {
  // If running via bun directly on the file
  return process.argv[1];
}
