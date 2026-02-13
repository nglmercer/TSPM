import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import type { ProcessConfig } from '../../core/types';
import { TSPM_HOME, DAEMON_PID_FILE, STATUS_FILE } from './constants';

export interface DaemonStatus {
  pid: number;
  startedAt: number;
  configFile: string;
}

export interface ProcessDaemonStatus {
  [key: string]: {
    pid: number;
    startedAt: number;
    config: ProcessConfig;
    state: string;
    restarts?: number;
    uptime?: number;
  };
}

/**
 * Ensure TSPM home directory exists
 */
export function ensureTSPMHome(): void {
  if (!existsSync(TSPM_HOME)) {
    mkdirSync(TSPM_HOME, { recursive: true });
  }
}

/**
 * Read daemon status
 */
export function readDaemonStatus(): DaemonStatus | null {
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
export function writeDaemonStatus(status: DaemonStatus): void {
  ensureTSPMHome();
  writeFileSync(DAEMON_PID_FILE, JSON.stringify(status, null, 2));
}

/**
 * Read process status file
 */
export function readProcessStatus(): ProcessDaemonStatus {
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
export function writeProcessStatus(status: ProcessDaemonStatus): void {
  ensureTSPMHome();
  writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
}

/**
 * Update process status in daemon
 */
export function updateProcessStatus(name: string, data: ProcessDaemonStatus[string]): void {
  const status = readProcessStatus();
  status[name] = data;
  writeProcessStatus(status);
}

/**
 * Remove process from status file
 */
export function removeProcessStatus(name: string): void {
  const status = readProcessStatus();
  delete status[name];
  writeProcessStatus(status);
}
