/**
 * Core type definitions for TSPM (TypeScript Process Manager)
 */

export interface ProcessConfig {
  name: string;
  script: string;
  args?: string[];
  env?: Record<string, string>;
  autorestart?: boolean;
  watch?: boolean | string[];
  stdout?: string;
  stderr?: string;
}

export interface TSPMConfig {
  processes: ProcessConfig[];
}

export interface ProcessStatus {
  name: string;
  pid?: number;
  killed?: boolean;
  exitCode?: number;
}
