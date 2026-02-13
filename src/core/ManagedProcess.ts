/**
 * Managed process module for TSPM
 * Handles individual process lifecycle, spawning, and monitoring
 */

import { spawn, type Subprocess } from "bun";
import type { ProcessConfig, ProcessStatus } from "./types";

export class ManagedProcess {
  private subprocess?: Subprocess;
  private config: ProcessConfig;
  private restartCount = 0;
  private isManuallyStopped = false;

  constructor(config: ProcessConfig) {
    this.config = config;
  }

  /**
   * Start the managed process
   */
  async start(): Promise<void> {
    this.isManuallyStopped = false;
    console.log(`[TSPM] Starting process: ${this.config.name}`);
    
    const stdoutPath = this.config.stdout;
    const stderrPath = this.config.stderr;

    // Ensure logs directory exists
    if (stdoutPath) {
      const dir = stdoutPath.split("/").slice(0, -1).join("/");
      if (dir) await Bun.write(Bun.file(`${dir}/.keep`), "");
    }

    this.subprocess = spawn({
      cmd: [this.config.script, ...(this.config.args || [])],
      env: { ...process.env, ...this.config.env },
      stdout: stdoutPath ? "pipe" : "inherit",
      stderr: stderrPath ? "pipe" : "inherit",
      onExit: (proc, exitCode, signalCode, error) => {
        this.handleExit(exitCode, signalCode, error);
      },
    });

    if (stdoutPath && this.subprocess.stdout instanceof ReadableStream) {
      this.streamToFile(this.subprocess.stdout, stdoutPath);
    }
    if (stderrPath && this.subprocess.stderr instanceof ReadableStream) {
      this.streamToFile(this.subprocess.stderr, stderrPath);
    }
  }

  /**
   * Stream process output to a file
   */
  private async streamToFile(stream: ReadableStream, path: string): Promise<void> {
    const writer = stream.getReader();
    // Using a persistent file handle for performance
    const fileHandle = Bun.file(path);
    try {
      while (true) {
        const { done, value } = await writer.read();
        if (done) break;
        // @ts-ignore - Bun.write supports append in newer versions
        await Bun.write(fileHandle, value, { append: true });
      }
    } catch (e) {
      console.error(`[TSPM] Error writing to ${path}: ${e}`);
    }
  }

  /**
   * Handle process exit event
   */
  private async handleExit(
    exitCode: number | null, 
    signalCode: number | null, 
    error: Error | undefined
  ): Promise<void> {
    if (this.isManuallyStopped) return;

    if (error) {
      console.error(`[TSPM] Process ${this.config.name} error: ${error.message}`);
    }

    console.log(`[TSPM] Process ${this.config.name} exited with code ${exitCode}`);
    
    if (this.config.autorestart !== false) {
      this.restartCount++;
      const delay = Math.min(1000 * Math.pow(2, this.restartCount), 30000); // Exponential backoff
      console.log(`[TSPM] Restarting ${this.config.name} in ${delay}ms...`);
      setTimeout(() => this.start(), delay);
    }
  }

  /**
   * Stop the managed process
   */
  stop(): void {
    this.isManuallyStopped = true;
    if (this.subprocess) {
      this.subprocess.kill();
      console.log(`[TSPM] Stopped process: ${this.config.name}`);
    }
  }

  /**
   * Get the current status of the managed process
   */
  getStatus(): ProcessStatus {
    const exitCode = this.subprocess?.exitCode;
    return {
      name: this.config.name,
      pid: this.subprocess?.pid,
      killed: this.subprocess?.killed,
      exitCode: exitCode !== null ? exitCode : undefined,
    };
  }

  /**
   * Get the process configuration
   */
  getConfig(): ProcessConfig {
    return this.config;
  }
}
