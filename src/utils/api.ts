import { ProcessManager } from "../core/ProcessManager";
import { log } from "./logger";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { 
  DEFAULT_HOST,
  DEFAULT_PORT,
  LOG_MESSAGES,
  EVENT_TYPES
} from "./constants";
import { Router } from "./web/router";

export interface ApiConfig {
    enabled?: boolean;
    port?: number;
    host?: string;
    dashboard?: boolean;
    enableCors?: boolean;
}

/**
 * Get the correct path to the public directory
 */
function getPublicDir(): string {
    // Get the directory of this file (utils)
    const utilsDir = dirname(fileURLToPath(import.meta.url));
    
    // Check if we're in production (dist/utils) or development (src/utils)
    // Production: dist/utils -> dist/public
    // Development: src/utils -> src/web/public
    const isProduction = utilsDir.includes('/dist/') || utilsDir.includes('\\dist\\');
    
    if (isProduction) {
        return join(utilsDir, "..", "public");
    }
    return join(utilsDir, "..", "web", "public");
}

/**
 * Start the JSON API server and Web Dashboard using the Router engine
 */
export async function startApi(manager: ProcessManager, config: ApiConfig) {
    if (config.enabled === false) return;

    const port = config.port === 0 ? 0 : (config.port || DEFAULT_PORT.API || 3000);
    const host = config.host || DEFAULT_HOST.ALL;
    let publicDir = getPublicDir();

    // In development mode, bundle the frontend to a temporary directory
    // This allows using Bun's bundling features (like .ts support) even if not "built"
    const isDev = !publicDir.includes('/dist/') && !publicDir.includes('\\dist\\');
    if (isDev) {
        try {
            const tempDir = join(process.cwd(), ".tspm", "web-dev");
            log.debug(`[TSPM Web] Dev Mode: Bundling frontend to ${tempDir}...`);
            await Bun.build({
                entrypoints: [join(publicDir, "index.html")],
                outdir: tempDir,
                minify: false,
                sourcemap: "inline"
            });
            publicDir = tempDir;
        } catch (e) {
            log.error(`[TSPM Web] Dev Mode bundling failed: ${e}`);
        }
    }

    try {
        // Create router instance
        const router = new Router({
            manager,
            publicDir,
            enableCors: config.enableCors ?? false
        });

        const server = Bun.serve({
            port,
            hostname: host,
            async fetch(req, server) {
                const url = new URL(req.url);
                const path = url.pathname;

                log.debug(LOG_MESSAGES.API_REQUEST(req.method, path));

                // WebSocket Upgrade for real-time updates
                if (path === "/ws") {
                    const success = server.upgrade(req);
                    return success ? undefined : new Response("WebSocket upgrade failed", { status: 400 });
                }

                // Handle API requests
                if (path.startsWith("/api/v1")) {
                    return router.handleRequest(req);
                }

                // Native Bun static file serving (faster)
                const filePath = path === "/" ? "index.html" : path.substring(1);
                const file = Bun.file(join(publicDir, filePath));
                
                if (await file.exists()) {
                    return new Response(file, {
                        headers: {
                            "Cache-Control": filePath.match(/\.(js|css|png|jpg|svg|woff2)$/) 
                                ? "public, max-age=31536000, immutable" 
                                : "no-cache"
                        }
                    });
                }

                // SPA Fallback: serve index.html for other routes
                const indexFile = Bun.file(join(publicDir, "index.html"));
                if (await indexFile.exists()) {
                    return new Response(indexFile);
                }

                return new Response("Not Found", { status: 404 });
            },
            websocket: {
                open(ws) {
                    ws.subscribe("logs");
                    ws.subscribe("updates");
                    log.debug("WebSocket client connected");
                },
                message(ws, message) {
                    // Handle client messages if needed
                },
                close(ws) {
                    ws.unsubscribe("logs");
                    ws.unsubscribe("updates");
                }
            }
        });

        // Forward TSPM events to WebSockets
        const emitter = manager.getEventEmitter();
        
        emitter.on(EVENT_TYPES.PROCESS_LOG, (event: any) => {
            server.publish("logs", JSON.stringify({
                type: 'process:log',
                payload: event.payload
            }));
        });

        // Periodic status updates with stats
        setInterval(() => {
            try {
                const statuses = manager.getStatuses();
                const processesWithStats = statuses.map(status => {
                    const proc = manager.getProcess(status.name);
                    // Trigger stats collection for each running process
                    if (proc && status.state === 'running') {
                        proc.getStats().catch(() => {}); // Fire and forget
                    }
                    const stats = proc?.getLastStats();
                    return {
                        ...status,
                        cpu: stats?.cpu || 0,
                        memory: stats?.memory || 0
                    };
                });
                
                server.publish("updates", JSON.stringify({
                    type: 'process:update',
                    payload: { processes: processesWithStats }
                }));
            } catch (e) {
                log.debug(`[TSPM Web] Error publishing process updates: ${e}`);
            }
        }, 2000);

        const actualPort = server.port ?? port;
        log.info(LOG_MESSAGES.API_STARTED(host, actualPort));
        log.info(`[TSPM Web] Dashboard available at http://${host === '0.0.0.0' ? 'localhost' : host}:${actualPort}`);
        
        if (config.dashboard) {
            log.info(`[TSPM Web] API Documentation at http://${host === '0.0.0.0' ? 'localhost' : host}:${actualPort}/api/v1`);
        }
    } catch (e) {
        log.error(LOG_MESSAGES.API_FAILED(String(e)));
    }
}
