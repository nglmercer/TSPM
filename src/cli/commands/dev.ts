import { ConfigLoader, ProcessManager } from '../../core';
import { log } from '../../utils/logger';
import { startApi } from '../../utils/api';
import { getDefaultEmitter, EventTypeValues, type ProcessLogEvent } from '../../utils/events';
import { APP_CONSTANTS, EXIT_CODES, SIGNALS } from '../../utils/config/constants';

export async function devCommand(
    configFile: string,
    options: {
        port?: string;
    }
): Promise<void> {
    const configPath = configFile || 'tspm.yaml';
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Starting development mode with ${configPath}`);

    try {
        const config = await ConfigLoader.load(configPath);
        
        // Force watch and structured logging for dev mode
        config.processes.forEach(p => {
            p.watch = p.watch ?? true;
        });

        const manager = new ProcessManager({
            webhooks: config.webhooks
        });

        // Add processes
        for (const pConfig of config.processes) {
            manager.addProcess(pConfig);
        }

        // Start all
        await manager.startAll();

        // Start API if configured or in dev mode
        startApi(manager, config.api || { enabled: true, port: parseInt(options.port || '3000') });

        // Subscribe to logs and print them to console
        const emitter = getDefaultEmitter();
        emitter.on(EventTypeValues.PROCESS_LOG, (event) => {
            const { processName, instanceId, message, type } = (event as ProcessLogEvent).data;
            const prefix = `[${processName}${instanceId !== undefined ? `:${instanceId}` : ''}]`;
            if (type === 'stderr') {
                process.stderr.write(`\x1b[31m${prefix} ${message}\x1b[0m`);
            } else {
                process.stdout.write(`\x1b[32m${prefix}\x1b[0m ${message}`);
            }
        });

        log.info(`${APP_CONSTANTS.LOG_PREFIX} Dev mode active. Watching for changes...`);

        // Keep alive
        return new Promise(() => {
            process.on(SIGNALS.INTERRUPT, async () => {
                log.info(`\n${APP_CONSTANTS.LOG_PREFIX} Shutting down dev mode...`);
                manager.stopAll();
                process.exit(EXIT_CODES.SUCCESS);
            });
        });

    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        log.error(`${APP_CONSTANTS.LOG_PREFIX} Failed to start dev mode: ${errorMessage}`);
        process.exit(EXIT_CODES.ERROR);
    }
}
