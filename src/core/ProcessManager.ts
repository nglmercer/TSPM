import type { ProcessConfig, ProcessStatus } from "./types";
import { ManagedProcess } from "./ManagedProcess";

export class ProcessManager {
  private processes: Map<string, ManagedProcess> = new Map();

  /**
   * Add a new process to be managed
   * @param config Process configuration
   */
  addProcess(config: ProcessConfig): void {
    const instanceCount = config.instances || 1;
    
    for (let i = 0; i < instanceCount; i++) {
        const process = new ManagedProcess(config, i);
        const name = i > 0 ? `${config.name}-${i}` : config.name;
        this.processes.set(name, process);
    }
  }

  /**
   * Get a managed process by name
   * @param name Process name
   * @returns ManagedProcess or undefined if not found
   */
  getProcess(name: string): ManagedProcess | undefined {
    return this.processes.get(name);
  }

  /**
   * Remove a process from management
   * @param name Process name or base name (to remove all instances)
   */
  removeProcess(name: string): void {
    const process = this.processes.get(name);
    if (process) {
      process.stop();
      this.processes.delete(name);
    } else {
      // Check if it's a base name for multiple instances
      for (const [procName, proc] of this.processes.entries()) {
        if (procName === name || procName.startsWith(`${name}-`)) {
          proc.stop();
          this.processes.delete(procName);
        }
      }
    }
  }

  /**
   * Start all managed processes
   */
  async startAll(): Promise<void> {
    for (const process of this.processes.values()) {
      await process.start();
    }
  }

  /**
   * Stop all managed processes
   */
  stopAll(): void {
    for (const process of this.processes.values()) {
      process.stop();
    }
  }

  /**
   * Get status of all managed processes
   * @returns Array of process statuses
   */
  getStatuses(): ProcessStatus[] {
    return Array.from(this.processes.values()).map(p => p.getStatus());
  }

  /**
   * Get the number of managed processes
   */
  get processCount(): number {
    return this.processes.size;
  }

  /**
   * Check if a process exists
   * @param name Process name or base name
   */
  hasProcess(name: string): boolean {
    if (this.processes.has(name)) return true;
    
    for (const procName of this.processes.keys()) {
      if (procName.startsWith(`${name}-`)) return true;
    }
    
    return false;
  }
}
