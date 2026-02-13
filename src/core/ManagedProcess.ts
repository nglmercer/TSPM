import { spawn, type Subprocess } from "bun";
import { watch, type FSWatcher } from "node:fs";
import type { ProcessConfig, ProcessStatus } from "./types";
import { 
  ENV_VARS, 
  WATCH_CONFIG, 
  DEFAULT_PROCESS_CONFIG, 
  PROCESS_STATE, 
  LOG_TYPE, 
  STOP_REASON, 
  RESTART_REASON,
  APP_CONSTANTS,
  MEMORY_CONFIG,
  SCRIPT_EXTENSIONS,
  TIMEOUTS,
  BUN_ENV_VARS,
  NODE_ENV_VARS,
  type RestartReason,
  type ProcessState
} from "../utils/config/constants";
import { getProcessStats, type ProcessStats } from "../utils/stats";
import { LogManager, log } from "../utils/logger";
import { EventEmitter, EventTypeValues, EventPriorityValues, createEvent, getDefaultEmitter } from "../utils/events";

export class ManagedProcess {
  private subprocess?: Subprocess;
  private config: ProcessConfig;
  private instanceId: number;
  private restartCount = 0;
  private isManuallyStopped = false;
  private lastStats: ProcessStats | null = null;
  private currentState: ProcessState = PROCESS_STATE.STOPPED;
  private eventEmitter: EventEmitter;
  private startedAt?: number;
  private watcher?: FSWatcher;
  private memoryMonitorInterval?: Timer;
  private firstStartTime?: number;

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
    
    // Setup watcher if enabled and not already watching
    if (this.config.watch && !this.watcher) {
      this.setupWatcher();
    }

    // Update state
    this.setState(PROCESS_STATE.STARTING);
    
    // 1. Run preStart script if defined
    if (this.config.preStart) {
      log.info(`${APP_CONSTANTS.LOG_PREFIX} Running preStart script for ${name}: ${this.config.preStart}`);
      try {
        const preStartResult = spawn({
          cmd: ["sh", "-c", this.config.preStart],
          cwd: this.config.cwd,
          env: { ...process.env, ...this.config.env },
        });
        await preStartResult.exited;
        if (preStartResult.exitCode !== 0) {
          log.warn(`${APP_CONSTANTS.LOG_PREFIX} preStart script for ${name} failed with code ${preStartResult.exitCode}`);
        }
      } catch (e) {
        log.error(`${APP_CONSTANTS.LOG_PREFIX} Error running preStart for ${name}: ${e}`);
      }
    }

    log.info(`${APP_CONSTANTS.LOG_PREFIX} Starting process: ${name} (instance: ${this.instanceId})`);
    
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
          log.warn(`${APP_CONSTANTS.LOG_PREFIX} dotEnv file not found: ${this.config.dotEnv}`);
        }
      } catch (e) {
        log.error(`${APP_CONSTANTS.LOG_PREFIX} Error loading dotEnv for ${name}: ${e}`);
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

    const cmd = [...(this.config.args || [])];
    let interpreter = this.config.script;

    // Use bun as default interpreter for JS/TS scripts if not explicitly provided
    if (this.config.script.endsWith(SCRIPT_EXTENSIONS.TYPESCRIPT) || this.config.script.endsWith(SCRIPT_EXTENSIONS.JAVASCRIPT)) {
      interpreter = APP_CONSTANTS.DEFAULT_INTERPRETER;
      cmd.unshift(this.config.script);
      
      // For Bun source maps
      env[BUN_ENV_VARS.VERBOSE_SOURCE_MAPS] = "true";
      
      if (this.config.script.endsWith(SCRIPT_EXTENSIONS.JAVASCRIPT)) {
        env[NODE_ENV_VARS.NODE_OPTIONS] = `${env.NODE_OPTIONS || ''} --enable-source-maps`.trim();
      }
    }

    this.subprocess = spawn({
      cmd: [interpreter, ...cmd],
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
    
    // 5. Start memory monitoring if maxMemory is configured
    this.startMemoryMonitoring();
    
    // Update state to running
    this.setState(PROCESS_STATE.RUNNING);
    
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
            log.warn(`${APP_CONSTANTS.LOG_PREFIX} postStart script for ${name} failed with code ${postStartResult.exitCode}`);
          }
        } catch (e) {
          log.error(`${APP_CONSTANTS.LOG_PREFIX} Error running postStart for ${name}: ${e}`);
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

    // Start memory monitoring
    this.startMemoryMonitoring();

    if (stdoutPath && this.subprocess.stdout instanceof ReadableStream) {
      this.asyncStreamToBuffer(this.subprocess.stdout, stdoutPath, LOG_TYPE.STDOUT);
    }
    if (stderrPath && this.subprocess.stderr instanceof ReadableStream) {
      this.asyncStreamToBuffer(this.subprocess.stderr, stderrPath, LOG_TYPE.STDERR);
    }
  }

  /**
   * Setup file watcher for hot reload
   */
  private setupWatcher(): void {
    const watchPath = this.config.cwd || process.cwd();
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Setup watcher for ${this.fullProcessName} on ${watchPath}`);
    
    let debounceTimer: Timer | null = null;
    
    try {
      this.watcher = watch(watchPath, { recursive: true }, (event, filename) => {
        if (!filename) return;

        // Ignore patterns
        const isIgnored = WATCH_CONFIG.defaultIgnore.some(pattern => {
          if (pattern.endsWith('/**')) {
            const dir = pattern.slice(0, -3);
            return filename.startsWith(dir);
          }
          return filename.endsWith(pattern.replace('*.', '.'));
        });

        if (isIgnored) return;

        log.debug(`${APP_CONSTANTS.LOG_PREFIX} Watcher: File changed: ${filename}`);

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.restart(RESTART_REASON.WATCH);
        }, WATCH_CONFIG.debounceMs);
      });
    } catch (e) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to setup watcher: ${e}`);
    }
  }

  /**
   * Restart the managed process
   */
  async restart(reason: RestartReason = RESTART_REASON.MANUAL): Promise<void> {
    const name = this.fullProcessName;
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Restarting process: ${name} (reason: ${reason})`);
    
    this.setState(PROCESS_STATE.RESTARTING);
    
    // Emit restart event
    this.eventEmitter.emit(createEvent(
      EventTypeValues.PROCESS_RESTART,
      'ManagedProcess',
      {
        processName: this.config.name,
        instanceId: this.instanceId,
        restartCount: ++this.restartCount,
        reason: reason,
      },
      EventPriorityValues.NORMAL
    ));

    // Stop without trigger handleExit logic that might cause double restart
    if (this.subprocess) {
      this.subprocess.kill();
      // Wait a bit for it to stop
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.GRACEFUL_STOP));
    }
    
    await this.start();
  }

  /**
   * Start memory monitoring for OOM detection
   */
  private startMemoryMonitoring(): void {
    const maxMemory = this.config.maxMemory || DEFAULT_PROCESS_CONFIG.maxMemory;
    
    // Only start monitoring if maxMemory is configured (> 0)
    if (maxMemory <= 0) return;
    
    // Clear any existing interval
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
    }
    
    this.memoryMonitorInterval = setInterval(async () => {
      if (!this.subprocess || !this.subprocess.pid || this.isManuallyStopped) {
        this.stopMemoryMonitoring();
        return;
      }
      
      const stats = await this.getStats();
      if (!stats) return;
      
      // Check if memory exceeds limit
      if (stats.memory > maxMemory) {
        log.warn(`${APP_CONSTANTS.LOG_PREFIX} Process ${this.fullProcessName} exceeded memory limit: ${stats.memory} bytes > ${maxMemory} bytes`);
        
        // Emit OOM event
        this.eventEmitter.emit(createEvent(
          EventTypeValues.PROCESS_OOM,
          'ManagedProcess',
          {
            processName: this.config.name,
            instanceId: this.instanceId,
            memory: stats.memory,
            limit: maxMemory,
          },
          EventPriorityValues.HIGH
        ));
        
        // Kill the process - this will trigger handleExit
        this.subprocess.kill();
      }
    }, MEMORY_CONFIG.checkInterval);
  }

  /**
   * Stop memory monitoring
   */
  private stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = undefined;
    }
  }

  /**
   * Stop the managed process
   */
  stop(): void {
    const name = this.fullProcessName;
    this.isManuallyStopped = true;
    
    // Stop memory monitoring
    this.stopMemoryMonitoring();
    
    this.setState(PROCESS_STATE.STOPPING);
    
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }

    if (this.subprocess) {
      this.subprocess.kill();
      log.info(`${APP_CONSTANTS.LOG_PREFIX} Stopped process: ${name}`);
      
      // Emit stop event
      this.eventEmitter.emit(createEvent(
        EventTypeValues.PROCESS_STOP,
        'ManagedProcess',
        {
          processName: this.config.name,
          instanceId: this.instanceId,
          pid: this.subprocess.pid,
          reason: STOP_REASON.MANUAL,
        },
        EventPriorityValues.NORMAL
      ));
    }
    
    this.setState(PROCESS_STATE.STOPPED);
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
  private async asyncStreamToBuffer(stream: ReadableStream, path: string, type: import("../utils/config/constants").LogType): Promise<void> {
    const writer = stream.getReader();
    const decoder = new TextDecoder();
    let bytesWritten = 0;

    try {
      while (true) {
        const { done, value } = await writer.read();
        if (done) break;
        
        const message = decoder.decode(value);
        
        // Emit log event
        this.eventEmitter.emit(createEvent(
          EventTypeValues.PROCESS_LOG,
          'ManagedProcess',
          {
            processName: this.config.name,
            instanceId: this.instanceId,
            message,
            type,
          },
          EventPriorityValues.LOW
        ));

        // @ts-ignore - Bun.write supports append in newer versions
        await Bun.write(path, value, { append: true });
        
        bytesWritten += value.length;
        if (bytesWritten >= MEMORY_CONFIG.rotateThreshold) {
            LogManager.rotate(path);
            bytesWritten = 0;
        }
      }
    } catch (e) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Error writing to ${path}: ${e}`);
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
      this.setState(PROCESS_STATE.STOPPED);
      return;
    }

    if (error) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Process ${name} error: ${error.message}`);
      this.setState(PROCESS_STATE.ERRORED);
      
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

    log.info(`${APP_CONSTANTS.LOG_PREFIX} Process ${name} exited with code ${exitCode}`);
    
    if (this.config.autorestart !== false) {
      this.restartCount++;
      const delay = Math.min(TIMEOUTS.BASE_RESTART_DELAY * Math.pow(2, this.restartCount), TIMEOUTS.MAX_RESTART_DELAY); // Exponential backoff
      log.info(`${APP_CONSTANTS.LOG_PREFIX} Restarting ${name} in ${delay}ms...`);
      
      this.setState(PROCESS_STATE.RESTARTING);
      
      // Emit restart event
      this.eventEmitter.emit(createEvent(
        EventTypeValues.PROCESS_RESTART,
        'ManagedProcess',
        {
          processName: this.config.name,
          instanceId: this.instanceId,
          restartCount: this.restartCount,
          delay,
          reason: RESTART_REASON.CRASH,
        },
        EventPriorityValues.NORMAL
      ));
      
      setTimeout(() => this.start(), delay);
    } else {
      this.setState(PROCESS_STATE.STOPPED);
    }
  }
}
