import { ProcessManager } from "../core/ProcessManager";
import { log } from "./logger";
import { 
  API, 
  API_MESSAGES, 
  API_ENDPOINTS, 
  HTTP_STATUS, 
  HTTP_CONTENT_TYPE, 
  HTTP_METHODS,
  DEFAULT_HOST,
  DEFAULT_PORT,
  CONSOLE_PREFIX,
  LOG_MESSAGES
} from "./constants";

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

    const port = config.port || DEFAULT_PORT.API;
    const host = config.host || DEFAULT_HOST.ALL;

    try {
        Bun.serve({
            port,
            hostname: host,
            async fetch(req) {
                const url = new URL(req.url);
                const path = url.pathname;
                const method = req.method;
                
                log.debug(LOG_MESSAGES.API_REQUEST(method, path));
                
                // Root / Status
                if (path === API_ENDPOINTS.ROOT || path === API_ENDPOINTS.STATUS) {
                    if (method === HTTP_METHODS.GET) {
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
                if (path.startsWith(API_ENDPOINTS.PROCESS)) {
                    const parts = path.split('/');
                    const action = parts[3]; // e.g., restart, stop, start
                    const name = parts[2];
                    
                    if (!name) return Response.json({ success: false, error: API_MESSAGES.PROCESS_NAME_REQUIRED }, { status: HTTP_STATUS.BAD_REQUEST });
                    
                    if (method === HTTP_METHODS.POST) {
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
                                    return Response.json({ success: false, error: API_MESSAGES.INVALID_ACTION }, { status: HTTP_STATUS.BAD_REQUEST });
                            }
                        } catch (e: unknown) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            return Response.json({ success: false, error: errorMessage }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
                        }
                    }
                }
                
                return new Response(JSON.stringify({ success: false, error: API_MESSAGES.NOT_FOUND }), { 
                    status: HTTP_STATUS.NOT_FOUND,
                    headers: { [HTTP_CONTENT_TYPE.JSON]: HTTP_CONTENT_TYPE.JSON }
                });
            }
        });

        log.info(LOG_MESSAGES.API_STARTED(host, port));
    } catch (e) {
        log.error(LOG_MESSAGES.API_FAILED(String(e)));
    }
}
