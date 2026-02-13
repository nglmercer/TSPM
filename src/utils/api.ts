import { ProcessManager } from "../core/ProcessManager";
import { log } from "./logger";

export interface ApiConfig {
    enabled?: boolean;
    port?: number;
    host?: string;
}

/**
 * Start the JSON API server
 */
export function startApi(manager: ProcessManager, config: ApiConfig) {
    if (config.enabled === false) return;

    const port = config.port || 3000;
    const host = config.host || '0.0.0.0';

    try {
        Bun.serve({
            port,
            hostname: host,
            async fetch(req) {
                const url = new URL(req.url);
                const path = url.pathname;
                const method = req.method;
                
                log.debug(`[TSPM API] ${method} ${path}`);
                
                // Root / Status
                if (path === '/' || path === '/status') {
                    if (method === 'GET') {
                        return Response.json({
                            success: true,
                            data: {
                                processes: manager.getStatuses(),
                                stats: {
                                    totalProcesses: manager.processCount,
                                    clusters: manager.clusterCount,
                                }
                            }
                        });
                    }
                }
                
                // Process Management
                if (path.startsWith('/process/')) {
                    const parts = path.split('/');
                    const action = parts[3]; // e.g., restart, stop, start
                    const name = parts[2];
                    
                    if (!name) return Response.json({ success: false, error: 'Process name required' }, { status: 400 });
                    
                    if (method === 'POST') {
                        try {
                            switch (action) {
                                case 'restart':
                                    await manager.restartProcess(name);
                                    return Response.json({ success: true, message: `Restarted ${name}` });
                                case 'stop':
                                    manager.stopProcess(name);
                                    return Response.json({ success: true, message: `Stopped ${name}` });
                                case 'start':
                                    await manager.startProcess(name);
                                    return Response.json({ success: true, message: `Started ${name}` });
                                default:
                                    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 });
                            }
                        } catch (e: any) {
                            return Response.json({ success: false, error: e.message }, { status: 500 });
                        }
                    }
                }
                
                return new Response(JSON.stringify({ success: false, error: 'Not Found' }), { 
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        });

        log.info(`[TSPM] API Server started on http://${host}:${port}`);
    } catch (e) {
        log.error(`[TSPM] Failed to start API Server: ${e}`);
    }
}
