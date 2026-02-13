import { spawn, type Subprocess } from "bun";
import type { ProcessConfig } from "./Config";

export class ManagedProcess {
  private subprocess?: Subprocess;
  private config: ProcessConfig;
  private restartCount = 0;
  private isManuallyStopped = false;

  constructor(config: ProcessConfig) {
    this.config = config;
  }

  async start() {
    this.isManuallyStopped = false;
    console.log(`[TSPM] Starting process: ${this.config.name}`);
    
    this.subprocess = spawn({
      cmd: [this.config.script, ...(this.config.args || [])],
      env: { ...process.env, ...this.config.env },
      stdout: "inherit",
      stderr: "inherit",
      onExit: (proc, exitCode, signalCode, error) => {
        this.handleExit(exitCode, signalCode, error);
      },
    });
  }

  private async handleExit(exitCode: number | null, signalCode: number | null, error: Error | undefined) {
    if (this.isManuallyStopped) return;

    console.log(`[TSPM] Process ${this.config.name} exited with code ${exitCode}`);
    
    if (this.config.autorestart !== false) {
      this.restartCount++;
      const delay = Math.min(1000 * Math.pow(2, this.restartCount), 30000); // Exponential backoff
      console.log(`[TSPM] Restarting ${this.config.name} in ${delay}ms...`);
      setTimeout(() => this.start(), delay);
    }
  }

  stop() {
    this.isManuallyStopped = true;
    if (this.subprocess) {
      this.subprocess.kill();
      console.log(`[TSPM] Stopped process: ${this.config.name}`);
    }
  }

  getStatus() {
    return {
      name: this.config.name,
      pid: this.subprocess?.pid,
      killed: this.subprocess?.killed,
      exitCode: this.subprocess?.exitCode,
    };
  }
}

export class ProcessManager {
  private processes: Map<string, ManagedProcess> = new Map();

  addProcess(config: ProcessConfig) {
    const process = new ManagedProcess(config);
    this.processes.set(config.name, process);
  }

  async startAll() {
    for (const process of this.processes.values()) {
      await process.start();
    }
  }

  stopAll() {
    for (const process of this.processes.values()) {
      process.stop();
    }
  }

  getStatuses() {
    return Array.from(this.processes.values()).map(p => p.getStatus());
  }
}
