import { spawn, type Subprocess } from "bun";
import type { ProcessConfig, ProcessStatus } from "./types";
import { ENV_VARS } from "../utils/config/constants";

export class ManagedProcess {
  private subprocess?: Subprocess;
  private config: ProcessConfig;
  private instanceId: number;
  private restartCount = 0;
  private isManuallyStopped = false;

  constructor(config: ProcessConfig, instanceId = 0) {
    this.config = config;
    this.instanceId = instanceId;
  }

  /**
   * Get formatted process name with instance ID
   */
  private get fullProcessName(): string {
    return this.instanceId > 0 
      ? `${this.config.name}-${this.instanceId}` 
      : this.config.name;
  }

  /**
   * Start the managed process
   */
  async start(): Promise<void> {
    this.isManuallyStopped = false;
    const name = this.fullProcessName;
    console.log(`[TSPM] Starting process: ${name} (instance: ${this.instanceId})`);
    
    const stdoutPath = this.config.stdout;
    const stderrPath = this.config.stderr;

    // Ensure logs directory exists
    if (stdoutPath) {
      const dir = stdoutPath.split("/").slice(0, -1).join("/");
      if (dir) await Bun.write(Bun.file(`${dir}/.keep`), "");
    }

    this.subprocess = spawn({
      cmd: [this.config.script, ...(this.config.args || [])],
      env: { 
        ...process.env, 
        ...this.config.env,
        [ENV_VARS.PROCESS_NAME]: name,
        [ENV_VARS.INSTANCE_ID]: this.instanceId.toString(),
      },
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
    const name = this.fullProcessName;
    if (this.isManuallyStopped) return;

    if (error) {
      console.error(`[TSPM] Process ${name} error: ${error.message}`);
    }

    console.log(`[TSPM] Process ${name} exited with code ${exitCode}`);
    
    if (this.config.autorestart !== false) {
      this.restartCount++;
      const delay = Math.min(1000 * Math.pow(2, this.restartCount), 30000); // Exponential backoff
      console.log(`[TSPM] Restarting ${name} in ${delay}ms...`);
      setTimeout(() => this.start(), delay);
    }
  }

  /**
   * Stop the managed process
   */
  stop(): void {
    const name = this.fullProcessName;
    this.isManuallyStopped = true;
    if (this.subprocess) {
      this.subprocess.kill();
      console.log(`[TSPM] Stopped process: ${name}`);
    }
  }

  /**
   * Get the current status of the managed process
   */
  getStatus(): ProcessStatus {
    const exitCode = this.subprocess?.exitCode;
    return {
      name: this.fullProcessName,
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

  /**
   * Get instance ID
   */
  getInstanceId(): number {
    return this.instanceId;
  }
}
