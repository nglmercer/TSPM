import { spawn, type Subprocess } from "bun";
import { watch, type FSWatcher } from "node:fs";
import type { ProcessConfig, ProcessStatus } from "./types";
import { ENV_VARS, WATCH_CONFIG } from "../utils/config/constants";
import { getProcessStats, type ProcessStats } from "../utils/stats";
import { LogManager, log } from "../utils/logger";
import { EventEmitter, EventTypeValues, EventPriorityValues, createEvent, getDefaultEmitter } from "../utils/events";
import type { TSPMEvent } from "../utils/events";

export type ProcessState = 'starting' | 'running' | 'stopping' | 'stopped' | 'errored' | 'restarting';

export class ManagedProcess {
  private subprocess?: Subprocess;
  private config: ProcessConfig;
  private instanceId: number;
  private restartCount = 0;
  private isManuallyStopped = false;
  private lastStats: ProcessStats | null = null;
  private currentState: ProcessState = 'stopped';
  private eventEmitter: EventEmitter;
  private startedAt?: number;
  private watcher?: FSWatcher;

  constructor(config: ProcessConfig, instanceId = 0, eventEmitter?: EventEmitter) {
    this.config = config;
    this.instanceId = instanceId;
    this.eventEmitter = eventEmitter || getDefaultEmitter();
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
    
    // Update state
    this.setState('starting');
    
    // 1. Run preStart script if defined
    if (this.config.preStart) {
      log.info(`[TSPM] Running preStart script for ${name}: ${this.config.preStart}`);
      try {
        const preStartResult = spawn({
          cmd: ["sh", "-c", this.config.preStart],
          cwd: this.config.cwd,
          env: { ...process.env, ...this.config.env },
        });
        await preStartResult.exited;
        if (preStartResult.exitCode !== 0) {
          log.warn(`[TSPM] preStart script for ${name} failed with code ${preStartResult.exitCode}`);
        }
      } catch (e) {
        log.error(`[TSPM] Error running preStart for ${name}: ${e}`);
      }
    }

    log.info(`[TSPM] Starting process: ${name} (instance: ${this.instanceId})`);
    
    const stdoutPath = this.config.stdout;
    const stderrPath = this.config.stderr;

    // Ensure logs directory exists
    if (stdoutPath) {
      const dir = stdoutPath.split("/").slice(0, -1).join("/");
      if (dir) await Bun.write(Bun.file(`${dir}/.keep`), "");
      // Initial check for rotation
      LogManager.rotate(stdoutPath);
    }
    if (stderrPath) {
        const dir = stderrPath.split("/").slice(0, -1).join("/");
        if (dir) await Bun.write(Bun.file(`${dir}/.keep`), "");
        LogManager.rotate(stderrPath);
    }

    // 2. Load dotEnv if defined
    let dotEnvVars: Record<string, string> = {};
    if (this.config.dotEnv) {
      try {
        const envFile = Bun.file(this.config.dotEnv);
        if (await envFile.exists()) {
          const content = await envFile.text();
          dotEnvVars = this.parseDotEnv(content);
        } else {
          log.warn(`[TSPM] dotEnv file not found: ${this.config.dotEnv}`);
        }
      } catch (e) {
        log.error(`[TSPM] Error loading dotEnv for ${name}: ${e}`);
      }
    }

    // 3. Prepare Environment
    const env = { 
      ...process.env,
      ...dotEnvVars,
      ...this.config.env,
      [ENV_VARS.PROCESS_NAME]: name,
      [ENV_VARS.INSTANCE_ID]: this.instanceId.toString(),
    } as Record<string, string>;

    // Enable source map support if it's a JS/TS script
    if (this.config.script.endsWith('.js')) {
      env.NODE_OPTIONS = `${env.NODE_OPTIONS || ''} --enable-source-maps`.trim();
    }
    if (this.config.script.endsWith('.ts') || this.config.script.endsWith('.js')) {
      // For Bun source maps
      env.BUN_CONFIG_VERBOSE_SOURCE_MAPS = "true";
    }

    this.subprocess = spawn({
      cmd: [this.config.script, ...(this.config.args || [])],
      cwd: this.config.cwd,
      env,
      stdout: stdoutPath ? "pipe" : "inherit",
      stderr: stderrPath ? "pipe" : "inherit",
      onExit: (proc, exitCode, signalCode, error) => {
        this.handleExit(exitCode, signalCode, error);
      },
    });

    // Record start time
    this.startedAt = Date.now();
    
    // Update state to running
    this.setState('running');
    
    // 4. Run postStart script if defined
    if (this.config.postStart) {
      // Run it in the background
      (async () => {
        try {
          const postStartResult = spawn({
            cmd: ["sh", "-c", this.config.postStart!],
            cwd: this.config.cwd,
            env: { ...env },
          });
          await postStartResult.exited;
          if (postStartResult.exitCode !== 0) {
            log.warn(`[TSPM] postStart script for ${name} failed with code ${postStartResult.exitCode}`);
          }
        } catch (e) {
          log.error(`[TSPM] Error running postStart for ${name}: ${e}`);
        }
      })();
    }

    // Emit process start event
    this.eventEmitter.emit(createEvent(
      EventTypeValues.PROCESS_START,
      'ManagedProcess',
      {
        processName: this.config.name,
        instanceId: this.instanceId,
        pid: this.subprocess.pid,
        config: this.config as unknown as Record<string, unknown>,
      },
      EventPriorityValues.NORMAL
    ));

    if (stdoutPath && this.subprocess.stdout instanceof ReadableStream) {
      this.streamToFile(this.subprocess.stdout, stdoutPath);
    }
    if (stderrPath && this.subprocess.stderr instanceof ReadableStream) {
      this.streamToFile(this.subprocess.stderr, stderrPath);
    }
  }

  /**
   * Parse dotenv content
   */
  private parseDotEnv(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1]!;
        let value = match[2] || '';
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Stream process output to a file with rotation
   */
  private async streamToFile(stream: ReadableStream, path: string): Promise<void> {
    const writer = stream.getReader();
    let bytesWritten = 0;
    const rotateThreshold = 64 * 1024; // Check rotation every 64KB written

    try {
      while (true) {
        const { done, value } = await writer.read();
        if (done) break;
        
        // @ts-ignore - Bun.write supports append in newer versions
        await Bun.write(path, value, { append: true });
        
        bytesWritten += value.length;
        if (bytesWritten >= rotateThreshold) {
            LogManager.rotate(path);
            bytesWritten = 0;
        }
      }
    } catch (e) {
      log.error(`[TSPM] Error writing to ${path}: ${e}`);
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
    
    // Emit process exit event
    this.eventEmitter.emit(createEvent(
      EventTypeValues.PROCESS_EXIT,
      'ManagedProcess',
      {
        processName: this.config.name,
        instanceId: this.instanceId,
        exitCode,
        signal: signalCode !== null ? signalCode.toString() : null,
      },
      EventPriorityValues.HIGH
    ));
    
    if (this.isManuallyStopped) {
      this.setState('stopped');
      return;
    }

    if (error) {
      log.error(`[TSPM] Process ${name} error: ${error.message}`);
      this.setState('errored');
      
      // Emit error event
      this.eventEmitter.emit(createEvent(
        EventTypeValues.PROCESS_ERROR,
        'ManagedProcess',
        {
          processName: this.config.name,
          instanceId: this.instanceId,
          error: error.message,
          stack: error.stack,
        },
        EventPriorityValues.HIGH
      ));
    }

    log.info(`[TSPM] Process ${name} exited with code ${exitCode}`);
    
    if (this.config.autorestart !== false) {
      this.restartCount++;
      const delay = Math.min(1000 * Math.pow(2, this.restartCount), 30000); // Exponential backoff
      log.info(`[TSPM] Restarting ${name} in ${delay}ms...`);
      
      this.setState('restarting');
      
      // Emit restart event
      this.eventEmitter.emit(createEvent(
        EventTypeValues.PROCESS_RESTART,
        'ManagedProcess',
        {
          processName: this.config.name,
          instanceId: this.instanceId,
          restartCount: this.restartCount,
          delay,
        },
        EventPriorityValues.NORMAL
      ));
      
      setTimeout(() => this.start(), delay);
    } else {
      this.setState('stopped');
    }
  }

  /**
   * Stop the managed process
   */
  stop(): void {
    const name = this.fullProcessName;
    this.isManuallyStopped = true;
    
    this.setState('stopping');
    
    if (this.subprocess) {
      this.subprocess.kill();
      log.info(`[TSPM] Stopped process: ${name}`);
      
      // Emit stop event
      this.eventEmitter.emit(createEvent(
        EventTypeValues.PROCESS_STOP,
        'ManagedProcess',
        {
          processName: this.config.name,
          instanceId: this.instanceId,
          pid: this.subprocess.pid,
          reason: 'manual',
        },
        EventPriorityValues.NORMAL
      ));
    }
    
    this.setState('stopped');
  }
  
  /**
   * Set the process state and emit state change event
   */
  private setState(newState: ProcessState): void {
    const previousState = this.currentState;
    this.currentState = newState;
    
    // Emit state change event
    this.eventEmitter.emit(createEvent(
      EventTypeValues.PROCESS_STATE_CHANGE,
      'ManagedProcess',
      {
        processName: this.config.name,
        instanceId: this.instanceId,
        previousState,
        currentState: newState,
      },
      EventPriorityValues.LOW
    ));
  }

  /**
   * Get the current status of the managed process
   */
  getStatus(): ProcessStatus {
    const exitCode = this.subprocess?.exitCode;
    const uptime = this.startedAt ? Date.now() - this.startedAt : undefined;
    return {
      name: this.fullProcessName,
      pid: this.subprocess?.pid,
      killed: this.subprocess?.killed,
      exitCode: exitCode !== null ? exitCode : undefined,
      state: this.currentState,
      restartCount: this.restartCount,
      uptime,
      instanceId: this.instanceId,
    };
  }
  
  /**
   * Get the current state
   */
  getState(): ProcessState {
    return this.currentState;
  }
  
  /**
   * Get the started at timestamp
   */
  getStartedAt(): number | undefined {
    return this.startedAt;
  }

  /**
   * Get real-time stats for the process
   */
  async getStats(): Promise<ProcessStats | null> {
    if (!this.subprocess || !this.subprocess.pid) return null;
    
    const stats = await getProcessStats(this.subprocess.pid);
    if (stats) {
        this.lastStats = stats;
    }
    return stats;
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

  /**
   * Get last collected stats
   */
  getLastStats(): import('../utils/stats').ProcessStats | null {
    return this.lastStats;
  }
}
