import { ConfigLoader, ProcessManager } from '../../core';
import { log } from '../../utils/logger';
import { startApi } from '../../utils/api';
import { getDefaultEmitter } from '../../utils/events';

export async function devCommand(
    configFile: string,
    options: {
        port?: string;
    }
): Promise<void> {
    const configPath = configFile || 'tspm.yaml';
    log.info(`[TSPM] Starting development mode with ${configPath}`);

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
        emitter.on('process:log', (event) => {
            const { processName, instanceId, message, type } = event.data as any;
            const prefix = `[${processName}${instanceId !== undefined ? `:${instanceId}` : ''}]`;
            if (type === 'stderr') {
                process.stderr.write(`\x1b[31m${prefix} ${message}\x1b[0m`);
            } else {
                process.stdout.write(`\x1b[32m${prefix}\x1b[0m ${message}`);
            }
        });

        log.info('[TSPM] Dev mode active. Watching for changes...');

        // Keep alive
        return new Promise(() => {
            process.on('SIGINT', async () => {
                log.info('\n[TSPM] Shutting down dev mode...');
                manager.stopAll();
                process.exit(0);
            });
        });

    } catch (e: any) {
        log.error(`[TSPM] Failed to start dev mode: ${e.message}`);
        process.exit(1);
    }
}
