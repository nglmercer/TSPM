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
import { isCompiled, getEmbeddedAssets, getMimeType } from "../web/embeddedAssets";

export interface ApiConfig {
    enabled?: boolean;
    port?: number;
    host?: string;
    dashboard?: boolean;
    enableCors?: boolean;
}

/**
 * Get the correct path to the public directory (for non-compiled mode only)
 */
function getPublicDir(): string {
    const utilsDir = dirname(fileURLToPath(import.meta.url));
    
    // Check if we're in production (dist/utils) or development (src/utils)
    const isProduction = utilsDir.includes('/dist/') || utilsDir.includes('\\dist\\');
    
    if (isProduction) {
        return join(utilsDir, "..", "public");
    }
    return join(utilsDir, "..", "web", "public");
}

/**
 * Create a static file handler that serves from embedded assets or filesystem
 */
function createStaticHandler(publicDir: string) {
    const compiled = isCompiled();
    const embeddedAssets = compiled ? getEmbeddedAssets() : null;

    if (compiled && embeddedAssets && embeddedAssets.size > 0) {
        log.info(`[TSPM Web] Serving ${embeddedAssets.size} embedded web assets`);
        
        // Log embedded file names for debugging
        for (const [name] of embeddedAssets) {
            log.debug(`[TSPM Web]   Embedded: ${name}`);
        }

        return async (filePath: string): Promise<Response | null> => {
            // Try exact match first
            let blob = embeddedAssets.get(filePath);
            
            // Try without leading path components (e.g., "index-hash.js" matches "index.js" request)
            if (!blob) {
                // For JS/CSS files, the bundler may produce hashed names like "index-q45a1mvp.js"
                // Try to find a matching file by base name pattern
                const ext = filePath.split('.').pop();
                const baseName = filePath.replace(/\.[^.]+$/, '');
                
                for (const [name, b] of embeddedAssets) {
                    // Match "index.js" to "index-q45a1mvp.js" style names
                    const nameBase = name.replace(/-[a-z0-9]+\./, '.');
                    if (nameBase === filePath) {
                        blob = b;
                        break;
                    }
                    // Also try direct name match
                    if (name === filePath) {
                        blob = b;
                        break;
                    }
                }
            }

            if (blob) {
                return new Response(blob, {
                    headers: {
                        "Content-Type": getMimeType(filePath),
                        "Cache-Control": filePath.match(/\.(js|css|png|jpg|svg|woff2)$/)
                            ? "public, max-age=31536000, immutable"
                            : "no-cache"
                    }
                });
            }

            return null;
        };
    }

    // Filesystem-based serving (development / non-compiled mode)
    return async (filePath: string): Promise<Response | null> => {
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

        return null;
    };
}

/**
 * Start the JSON API server and Web Dashboard using the Router engine
 */
export async function startApi(manager: ProcessManager, config: ApiConfig) {
    if (config.enabled === false) return;

    const port = config.port === 0 ? 0 : (config.port || DEFAULT_PORT.API || 3000);
    const host = config.host || DEFAULT_HOST.ALL;
    
    const compiled = isCompiled();
    let publicDir = '';
    if (!compiled) {
        publicDir = getPublicDir();
        
        // In development mode, bundle the frontend to a temporary directory
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
    }
    // console.log({
    //     compiled,
    //     publicDir
    // })
    // Create the static file handler (works for both embedded and filesystem modes)
    const serveStatic = createStaticHandler(publicDir);

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

                // Serve static files (from embedded assets or filesystem)
                const filePath = path === "/" ? "index.html" : path.substring(1);
                const staticResponse = await serveStatic(filePath);
                if (staticResponse) return staticResponse;

                // SPA Fallback: serve index.html
                const indexResponse = await serveStatic("index.html");
                if (indexResponse) return indexResponse;

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
                    if (proc && status.state === 'running') {
                        proc.getStats().catch(() => {});
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
