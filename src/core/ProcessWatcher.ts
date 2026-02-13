import { watch, type FSWatcher } from "node:fs";
import { WATCH_CONFIG, RESTART_REASON, type RestartReason } from "../utils/config/constants";
import { log } from "../utils/logger";

export class ProcessWatcher {
  private watcher?: FSWatcher;

  constructor(
    private fullProcessName: string,
    private cwd: string | undefined,
    private onRestart: (reason: RestartReason) => void
  ) {}

  /**
   * Setup file watcher for hot reload
   */
  start(): void {
    const watchPath = this.cwd || process.cwd();
    log.info(`[TSPM] Setup watcher for ${this.fullProcessName} on ${watchPath}`);
    
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

        log.debug(`[TSPM] Watcher: File changed: ${filename}`);

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.onRestart(RESTART_REASON.WATCH);
        }, WATCH_CONFIG.debounceMs);
      });
    } catch (e) {
      log.error(`[TSPM] Failed to setup watcher: ${e}`);
    }
  }

  /**
   * Stop the watcher
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
  }
}
