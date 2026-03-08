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
import { LogManager, log, eventLogger } from "../utils/logger";
import { EventEmitter, EventTypeValues, EventPriorityValues, createEvent, getDefaultEmitter } from "../utils/events";

/** A single in-memory log entry */
export interface LogEntry {
  timestamp: string;
  type: 'stdout' | 'stderr';
  message: string;
}

/** Fixed-size circular log buffer */
class LogBuffer {
  private entries: LogEntry[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 2000) {
    this.maxSize = maxSize;
  }

  push(entry: LogEntry): void {
    if (this.entries.length >= this.maxSize) {
      this.entries.shift();
    }
    this.entries.push(entry);
  }

  get(limit?: number): LogEntry[] {
    if (!limit || limit >= this.entries.length) return [...this.entries];
    return this.entries.slice(-limit);
  }

  clear(): void {
    this.entries = [];
  }

  get size(): number {
    return this.entries.length;
  }
}

export class ManagedProcess {
  private subprocess?: Subprocess;
  private config: ProcessConfig;
  private instanceId: number;
  private restartCount = 0;
  private isManuallyStopped = false;
  private isReady = false;
  private lastStats: ProcessStats | null = null;
  private currentState: ProcessState = PROCESS_STATE.STOPPED;
  private eventEmitter: EventEmitter;
  private startedAt?: number;
  private watcher?: FSWatcher;
  private memoryMonitorInterval?: Timer;
  private listenTimeoutTimer?: Timer;
  private logBuffer: LogBuffer = new LogBuffer();

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

    // 3. Prepare Environment with instance variable support
    const instanceVarName = this.config.instanceVar || DEFAULT_PROCESS_CONFIG.instanceVar;
    const env = { 
      ...process.env,
      ...dotEnvVars,
      ...this.config.env,
      [ENV_VARS.PROCESS_NAME]: name,
      [instanceVarName]: this.instanceId.toString(),
    } as Record<string, string>;

    const cmd = [...(this.config.args || [])];
    let interpreter = this.config.interpreter;
    let script = this.config.script;

    // Logic to determine what to run
    if (!interpreter) {
      // Use bun as default interpreter for JS/TS scripts if not explicitly provided
      if (script.endsWith(SCRIPT_EXTENSIONS.TYPESCRIPT) || script.endsWith(SCRIPT_EXTENSIONS.JAVASCRIPT)) {
        interpreter = APP_CONSTANTS.DEFAULT_INTERPRETER;
        cmd.unshift(script);
        
        // For Bun source maps
        env[BUN_ENV_VARS.VERBOSE_SOURCE_MAPS] = "true";
        
        if (script.endsWith(SCRIPT_EXTENSIONS.JAVASCRIPT)) {
          env[NODE_ENV_VARS.NODE_OPTIONS] = `${env.NODE_OPTIONS || ''} --enable-source-maps`.trim();
        }
      } else {
        // If no interpreter and not a JS/TS script, check if it's a complex command
        if (script.includes(' ') && !script.startsWith('./') && !script.startsWith('/')) {
            // It looks like a command string e.g. "bun run start"
            interpreter = 'sh';
            cmd.unshift('-c', script);
        } else {
            // It's likely a binary or script we can execute directly
            interpreter = script;
        }
      }
    } else if (interpreter === 'none') {
        // Explicitly no interpreter, run script directly
        interpreter = script;
    } else {
        // Use provided interpreter
        cmd.unshift(script);
    }

    this.subprocess = spawn({
      cmd: [interpreter, ...cmd],
      cwd: this.config.cwd,
      env,
      stdout: "pipe",
      stderr: "pipe",
      stdin: "pipe",
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

    // Log to persistent event history
    eventLogger.log("process:start", { 
        name: this.config.name, 
        instance: this.instanceId, 
        pid: this.subprocess.pid,
        interpreter: interpreter,
        script: this.config.script
    }).catch(e => log.error(`Failed to log process:start: ${e}`));

    // Always stream stdout and stderr into the in-memory buffer.
    // File writing is a secondary optional concern handled inside the stream reader.
    if (this.subprocess.stdout instanceof ReadableStream) {
      this.asyncStreamToBuffer(this.subprocess.stdout, stdoutPath ?? null, LOG_TYPE.STDOUT);
    }
    if (this.subprocess.stderr instanceof ReadableStream) {
      this.asyncStreamToBuffer(this.subprocess.stderr, stderrPath ?? null, LOG_TYPE.STDERR);
    }
  }

  /**
   * Setup file watcher for hot reload
   * Uses watchDelay from config (defaults to WATCH_CONFIG.debounceMs)
   */
  private setupWatcher(): void {
    const watchPath = this.config.cwd || process.cwd();
    const watchDelay = this.config.watchDelay ?? WATCH_CONFIG.debounceMs;
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Setup watcher for ${this.fullProcessName} on ${watchPath} (delay: ${watchDelay}ms)`);
    
    let debounceTimer: Timer | null = null;
    
    try {
      this.watcher = watch(watchPath, { recursive: true }, (event, filename) => {
        if (!filename) return;

        // Ignore patterns from config
        const ignorePatterns = this.config.ignoreWatch || WATCH_CONFIG.defaultIgnore;
        const isIgnored = ignorePatterns.some(pattern => {
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
        }, watchDelay);
      });
    } catch (e) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to setup watcher: ${e}`);
    }
  }

  /**
   * Signal that the process is ready (for waitReady)
   * Applications can call this to indicate they're ready to accept traffic
   */
  public markReady(): void {
    this.isReady = true;
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Process ${this.fullProcessName} marked as ready`);
    
    // Emit ready event
    this.eventEmitter.emit(createEvent(
      EventTypeValues.PROCESS_READY,
      'ManagedProcess',
      {
        processName: this.config.name,
        instanceId: this.instanceId,
        pid: this.subprocess?.pid,
      },
      EventPriorityValues.NORMAL
    ));
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
  async stop(): Promise<void> {
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

      // Log to persistent event history
      await eventLogger.log("process:stop", { 
          name: this.config.name, 
          instance: this.instanceId, 
          pid: this.subprocess.pid 
      });
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
   * Stream process output into the in-memory log buffer.
   * Optionally also writes to a file when `filePath` is provided.
   */
  private async asyncStreamToBuffer(
    stream: ReadableStream,
    filePath: string | null,
    type: import("../utils/config/constants").LogType
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let bytesWritten = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value);
        // Split on newlines so each line is its own entry
        const lines = raw.split(/\r?\n/);

        for (const line of lines) {
          if (!line) continue;

          const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            type: type as 'stdout' | 'stderr',
            message: line,
          };

          // Store in-memory
          this.logBuffer.push(entry);

          // Emit log event for subscribers
          this.eventEmitter.emit(createEvent(
            EventTypeValues.PROCESS_LOG,
            'ManagedProcess',
            {
              processName: this.config.name,
              instanceId: this.instanceId,
              message: line,
              type,
            },
            EventPriorityValues.LOW
          ));
        }

        // Optional file write
        if (filePath) {
          // @ts-ignore - Bun.write supports append in newer versions
          await Bun.write(filePath, value, { append: true });
          bytesWritten += value.length;
          if (bytesWritten >= MEMORY_CONFIG.rotateThreshold) {
            LogManager.rotate(filePath);
            bytesWritten = 0;
          }
        }
      }
    } catch (e) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Error reading stream for ${this.fullProcessName}: ${e}`);
    }
  }

  /**
   * Get in-memory log entries for this process
   * @param limit - Maximum number of entries to return (most recent first)
   */
  getLogs(limit?: number): LogEntry[] {
    return this.logBuffer.get(limit);
  }

  /**
   * Clear the in-memory log buffer
   */
  clearLogs(): void {
    this.logBuffer.clear();
  }

  /**
   * Send raw text input to the process stdin.
   * The process must have been started with stdin: 'pipe' (which is now always true).
   * @param input - Text to send (newline will be appended if missing)
   */
  sendInput(input: string): boolean {
    if (!this.subprocess || !this.subprocess.stdin) {
      return false;
    }
    const sink = this.subprocess.stdin;
    // stdin can be FileSink or a file descriptor number; only FileSink has .write()
    if (typeof sink === 'number' || typeof sink.write !== 'function') {
      return false;
    }
    try {
      const data = input.endsWith('\n') ? input : input + '\n';
      sink.write(data);
      return true;
    } catch (e) {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to write stdin for ${this.fullProcessName}: ${e}`);
      return false;
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

    // Log to persistent event history
    await eventLogger.log("process:exit", { 
        name: this.config.name, 
        instance: this.instanceId, 
        exitCode, 
        signal: signalCode 
    });
    
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
      const maxRestarts = this.config.maxRestarts ?? DEFAULT_PROCESS_CONFIG.maxRestarts;
      
      if (this.restartCount >= maxRestarts) {
        log.warn(`${APP_CONSTANTS.LOG_PREFIX} Process ${name} reached max restarts (${maxRestarts}). Giving up.`);
        this.setState(PROCESS_STATE.ERRORED);
        return;
      }

      this.restartCount++;
      
      let delay = this.config.restartDelay;
      if (delay === undefined) {
        delay = Math.min(TIMEOUTS.BASE_RESTART_DELAY * Math.pow(2, this.restartCount), TIMEOUTS.MAX_RESTART_DELAY);
      }
      
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
