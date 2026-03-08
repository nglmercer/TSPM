/**
 * Router Engine for TSPM Web Server
 */

import { 
    HTTP_STATUS, 
    HTTP_CONTENT_TYPE
} from "../constants";
import { log } from "../logger";
import { join } from "path";
import type { 
    HttpMethod, 
    RouteHandler, 
    Route, 
    RouterConfig, 
    ProcessStatusWithStats 
} from "./types";
import { registerProcessRoutes } from "./routes/process";
import { registerSystemRoutes } from "./routes/system";

export class Router {
    private routes: Route[] = [];
    public config: RouterConfig;
    private globalPrefix: string = '/api/v1';

    constructor(config: RouterConfig) {
        this.config = config;
        this.registerRoutes();
    }

    private registerRoutes(): void {
        registerProcessRoutes(this);
        registerSystemRoutes(this);
    }

    /**
     * Get process statuses with stats (cpu, memory)
     */
    public getStatusesWithStats(): ProcessStatusWithStats[] {
        const statuses = this.config.manager.getStatuses();
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
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        this.routes.push({ method, path: normalizedPath, handler });
    }

    /**
     * Match a request to a route
     */
    private matchRoute(method: HttpMethod, url: string): { handler: RouteHandler; params: Record<string, string> } | null {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

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

    private matchPath(pattern: string, path: string): Record<string, string> | null {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length) return null;

        const params: Record<string, string> = {};

        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i]!;
            const pathPart = pathParts[i]!;

            if (patternPart.startsWith(':')) {
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

    private getCacheControl(fileName: string): string {
        const staticAssets = ['.css', '.js', '.woff2', '.ttf', '.png', '.jpg', '.svg', '.ico'];
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        
        if (staticAssets.includes(ext)) {
            return 'public, max-age=31536000'; 
        }
        
        return 'no-cache';
    }

    private handleCors(req: Request): Headers {
        const headers = new Headers();
        if (this.config.enableCors) {
            headers.set('Access-Control-Allow-Origin', '*');
            headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        return headers;
    }

    async handleRequest(req: Request): Promise<Response> {
        const method = req.method as HttpMethod;
        const url = req.url;

        if (method === 'OPTIONS' && this.config.enableCors) {
            return new Response(null, {
                status: HTTP_STATUS.OK,
                headers: this.handleCors(req)
            });
        }

        const matched = this.matchRoute(method, url);
        if (matched) {
            try {
                const response = await matched.handler(req, matched.params);
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

        const staticResponse = await this.serveStatic(req);
        if (staticResponse) return staticResponse;

        const indexPath = join(this.config.publicDir, 'index.html');
        const indexFile = Bun.file(indexPath);
        
        if (await indexFile.exists()) {
            return new Response(indexFile, {
                headers: { 'Content-Type': HTTP_CONTENT_TYPE.HTML }
            });
        }

        return Response.json({
            success: false,
            error: 'Not Found',
            path: new URL(url).pathname
        }, { status: HTTP_STATUS.NOT_FOUND });
    }
}
