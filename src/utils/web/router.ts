/**
 * Router Engine for TSPM Web Server
 * A lightweight, flexible router for Bun-based HTTP servers
 */

import { 
    HTTP_METHODS, 
    HTTP_STATUS, 
    HTTP_CONTENT_TYPE,
    API 
} from "../constants";
import type { ProcessManager } from "../../core/ProcessManager";
import type { ProcessConfig } from "../../core/types";
import { log } from "../logger";
import { join } from "path";
import { readdir, stat } from "fs/promises";

// ============================================================================
// Types
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export interface ProcessStatusWithStats {
    name: string;
    pid?: number;
    killed?: boolean;
    exitCode?: number;
    state?: string;
    restartCount?: number;
    uptime?: number;
    instanceId?: number;
    clusterGroup?: string;
    healthy?: boolean;
    namespace?: string;
    cpu: number;
    memory: number;
}

export interface RouteHandler {
    (req: Request, params?: Record<string, string>): Promise<Response> | Response;
}

export interface Route {
    method: HttpMethod;
    path: string;
    handler: RouteHandler;
}

export interface RouterConfig {
    manager: ProcessManager;
    publicDir: string;
    enableCors?: boolean;
}

// ============================================================================
// MIME Types
// ============================================================================

// MIME types are handled automatically by Bun.file()


// ============================================================================
// Router Class
// ============================================================================

export class Router {
    private routes: Route[] = [];
    private config: RouterConfig;
    private globalPrefix: string = '/api/v1';

    constructor(config: RouterConfig) {
        this.config = config;
        this.registerApiRoutes();
    }

    /**
     * Register API routes
     */
    private registerApiRoutes(): void {
        const { manager } = this.config;

        // Status endpoint
        this.addRoute('GET', '/status', async () => {
            const statuses = this.getStatusesWithStats();
            return Response.json({
                success: true,
                data: {
                    processes: statuses,
                    stats: {
                        totalProcesses: statuses.length,
                        clusters: manager.clusterCount,
                        version: API.VERSION,
                    }
                }
            });
        });

        // Execute command
        this.addRoute('POST', '/execute', async (req) => {
            try {
                const body = await req.json() as { command?: string; cwd?: string };
                const { command, cwd } = body;
                
                if (!command) {
                    return Response.json({ 
                        success: false, 
                        error: "Command required" 
                    }, { status: HTTP_STATUS.BAD_REQUEST });
                }

                const args = command.split(" ").filter(Boolean);
                const proc = Bun.spawn(args, {
                    cwd: cwd || process.cwd(),
                    stdout: "pipe",
                    stderr: "pipe"
                });

                const [output, error] = await Promise.all([
                    new Response(proc.stdout).text(),
                    new Response(proc.stderr).text()
                ]);

                return Response.json({ 
                    success: true, 
                    output, 
                    error,
                    exitCode: proc.exitCode
                });
            } catch (e: any) {
                return Response.json({ 
                    success: false, 
                    error: e.message 
                }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
            }
        });

        // List all processes
        this.addRoute('GET', '/processes', async () => {
            return Response.json({
                success: true,
                data: this.getStatusesWithStats()
            });
        });

        // Get single process
        this.addRoute('GET', '/processes/:name', async (req, params) => {
            const name = params?.['name'];
            if (!name) {
                return Response.json({ 
                    success: false, 
                    error: "Process name required" 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }

            const statuses = this.getStatusesWithStats();
            const process = statuses.find(p => p.name === name);

            if (!process) {
                return Response.json({ 
                    success: false, 
                    error: "Process not found" 
                }, { status: HTTP_STATUS.NOT_FOUND });
            }

            return Response.json({
                success: true,
                data: process
            });
        });

        // Create new process
        this.addRoute('POST', '/processes', async (req) => {
            try {
                const procConfig = await req.json() as ProcessConfig;
                
                if (!procConfig.name || !procConfig.script) {
                    return Response.json({ 
                        success: false, 
                        error: "Name and script are required" 
                    }, { status: HTTP_STATUS.BAD_REQUEST });
                }

                manager.addProcess(procConfig);
                await manager.startProcess(procConfig.name);
                
                return Response.json({ 
                    success: true, 
                    message: `Spawned ${procConfig.name}` 
                });
            } catch (e: any) {
                return Response.json({ 
                    success: false, 
                    error: e.message 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }
        });

        // Start process
        this.addRoute('POST', '/processes/:name/start', async (req, params) => {
            const name = params?.['name'];
            if (!name) {
                return Response.json({ 
                    success: false, 
                    error: "Process name required" 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }

            try {
                await manager.startProcess(name);
                return Response.json({ 
                    success: true, 
                    message: `Started ${name}` 
                });
            } catch (e: any) {
                return Response.json({ 
                    success: false, 
                    error: e.message 
                }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
            }
        });

        // Stop process
        this.addRoute('POST', '/processes/:name/stop', async (req, params) => {
            const name = params?.['name'];
            if (!name) {
                return Response.json({ 
                    success: false, 
                    error: "Process name required" 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }

            try {
                manager.stopProcess(name);
                return Response.json({ 
                    success: true, 
                    message: `Stopped ${name}` 
                });
            } catch (e: any) {
                return Response.json({ 
                    success: false, 
                    error: e.message 
                }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
            }
        });

        // Restart process
        this.addRoute('POST', '/processes/:name/restart', async (req, params) => {
            const name = params?.['name'];
            if (!name) {
                return Response.json({ 
                    success: false, 
                    error: "Process name required" 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }

            try {
                await manager.restartProcess(name);
                return Response.json({ 
                    success: true, 
                    message: `Restarted ${name}` 
                });
            } catch (e: any) {
                return Response.json({ 
                    success: false, 
                    error: e.message 
                }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
            }
        });

        // Delete process
        this.addRoute('DELETE', '/processes/:name', async (req, params) => {
            const name = params?.['name'];
            if (!name) {
                return Response.json({ 
                    success: false, 
                    error: "Process name required" 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }

            try {
                manager.stopProcess(name);
                // Note: You might want to add a removeProcess method to ProcessManager
                return Response.json({ 
                    success: true, 
                    message: `Removed ${name}` 
                });
            } catch (e: any) {
                return Response.json({ 
                    success: false, 
                    error: e.message 
                }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
            }
        });

        // Get process logs
        this.addRoute('GET', '/processes/:name/logs', async (req, params) => {
            const name = params?.['name'];
            if (!name) {
                return Response.json({ 
                    success: false, 
                    error: "Process name required" 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }

            // Get last N lines of logs (from ProcessManager)
            const limit = parseInt(new URL(req.url).searchParams.get('limit') || '100');
            
            return Response.json({
                success: true,
                data: {
                    processName: name,
                    logs: [], // Would integrate with actual log system
                    limit
                }
            });
        });

        // Get system stats
        this.addRoute('GET', '/stats', async () => {
            const statuses = this.getStatusesWithStats();
            
            let totalCpu = 0;
            let totalMem = 0;
            let running = 0;
            let stopped = 0;
            let errored = 0;

            statuses.forEach(p => {
                totalCpu += p.cpu;
                totalMem += p.memory;
                if (p.state === 'running') running++;
                else if (p.state === 'errored') errored++;
                else stopped++;
            });

            return Response.json({
                success: true,
                data: {
                    cpu: Math.round(totalCpu),
                    memory: totalMem,
                    processes: {
                        total: statuses.length,
                        running,
                        stopped,
                        errored
                    },
                    clusters: manager.clusterCount,
                    uptime: process.uptime() * 1000
                }
            });
        });

        // Health check
        this.addRoute('GET', '/health', async () => {
            return Response.json({
                success: true,
                status: 'healthy',
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Get process statuses with stats (cpu, memory)
     */
    private getStatusesWithStats(): ProcessStatusWithStats[] {
        const statuses = this.config.manager.getStatuses();
        
        // Return with default values if no stats available
        return statuses.map(status => {
            const proc = this.config.manager.getProcess(status.name);
            const stats = proc?.getLastStats();
            return {
                ...status,
                cpu: stats?.cpu || 0,
                memory: stats?.memory || 0
            };
        });
    }

    /**
     * Add a route to the router
     */
    addRoute(method: HttpMethod, path: string, handler: RouteHandler): void {
        // Ensure path starts with /
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        this.routes.push({ method, path: normalizedPath, handler });
    }

    /**
     * Match a request to a route
     */
    private matchRoute(method: HttpMethod, url: string): { handler: RouteHandler; params: Record<string, string> } | null {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        // Check API routes
        if (path.startsWith(this.globalPrefix)) {
            const apiPath = path.substring(this.globalPrefix.length) || '/';
            
            for (const route of this.routes) {
                if (route.method !== method) continue;
                
                const params = this.matchPath(route.path, apiPath);
                if (params !== null) {
                    return { handler: route.handler, params };
                }
            }
        }

        return null;
    }

    /**
     * Match path against route pattern
     */
    private matchPath(pattern: string, path: string): Record<string, string> | null {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length) {
            return null;
        }

        const params: Record<string, string> = {};

        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i]!;
            const pathPart = pathParts[i]!;

            if (patternPart.startsWith(':')) {
                // This is a parameter
                params[patternPart.substring(1)] = pathPart;
            } else if (patternPart !== pathPart) {
                return null;
            }
        }

        return params;
    }

    /**
     * Serve static files
     */
    async serveStatic(req: Request): Promise<Response | null> {
        const url = new URL(req.url);
        let fileName = url.pathname === "/" ? "index.html" : url.pathname.substring(1);
        
        // Security: prevent directory traversal
        if (fileName.includes('..')) {
            return new Response('Forbidden', { status: HTTP_STATUS.BAD_REQUEST });
        }

        const filePath = join(this.config.publicDir, fileName);
        const file = Bun.file(filePath);
        
        if (await file.exists()) {
            return new Response(file, {
                headers: {
                    'Cache-Control': this.getCacheControl(fileName)
                }
            });
        }

        return null;
    }

    /**
     * Get cache control header based on file type
     */
    private getCacheControl(fileName: string): string {
        // Cache static assets for longer
        const staticAssets = ['.css', '.js', '.woff2', '.ttf', '.png', '.jpg', '.svg', '.ico'];
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        
        if (staticAssets.includes(ext)) {
            return 'public, max-age=31536000'; // 1 year
        }
        
        return 'no-cache';
    }

    /**
     * Handle CORS
     */
    private handleCors(req: Request): Headers {
        const headers = new Headers();
        
        if (this.config.enableCors) {
            headers.set('Access-Control-Allow-Origin', '*');
            headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        
        return headers;
    }

    /**
     * Main request handler
     */
    async handleRequest(req: Request): Promise<Response> {
        const method = req.method as HttpMethod;
        const url = req.url;

        // Handle CORS preflight
        if (method === 'OPTIONS' && this.config.enableCors) {
            return new Response(null, {
                status: HTTP_STATUS.OK,
                headers: this.handleCors(req)
            });
        }

        // Try to match API route
        const matched = this.matchRoute(method, url);
        
        if (matched) {
            try {
                const response = await matched.handler(req, matched.params);
                
                // Add CORS headers if enabled
                if (this.config.enableCors) {
                    const corsHeaders = this.handleCors(req);
                    const newHeaders = new Headers(response.headers);
                    corsHeaders.forEach((value, key) => {
                        newHeaders.set(key, value);
                    });
                    
                    return new Response(response.body, {
                        status: response.status,
                        headers: newHeaders
                    });
                }
                
                return response;
            } catch (e: any) {
                log.error(`Route handler error: ${e.message}`);
                return Response.json({
                    success: false,
                    error: 'Internal server error'
                }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
            }
        }

        // Try to serve static file
        const staticResponse = await this.serveStatic(req);
        
        if (staticResponse) {
            return staticResponse;
        }

        // SPA fallback - serve index.html for client-side routing
        const indexPath = join(this.config.publicDir, 'index.html');
        const indexFile = Bun.file(indexPath);
        
        if (await indexFile.exists()) {
            return new Response(indexFile, {
                headers: { 'Content-Type': HTTP_CONTENT_TYPE.HTML }
            });
        }

        // 404 response
        return Response.json({
            success: false,
            error: 'Not Found',
            path: new URL(url).pathname
        }, { status: HTTP_STATUS.NOT_FOUND });
    }
}
