/**
 * Process manager module for TSPM
 * Manages multiple managed processes and their lifecycle
 */

import type { ProcessConfig, ProcessStatus } from "./types";
import { ManagedProcess } from "./ManagedProcess";

export class ProcessManager {
  private processes: Map<string, ManagedProcess> = new Map();

  /**
   * Add a new process to be managed
   * @param config Process configuration
   */
  addProcess(config: ProcessConfig): void {
    const process = new ManagedProcess(config);
    this.processes.set(config.name, process);
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
   * @param name Process name
   */
  removeProcess(name: string): void {
    const process = this.processes.get(name);
    if (process) {
      process.stop();
      this.processes.delete(name);
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
   * @param name Process name
   */
  hasProcess(name: string): boolean {
    return this.processes.has(name);
  }
}
