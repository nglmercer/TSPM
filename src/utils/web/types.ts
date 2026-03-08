import type { ProcessManager } from "../../core/ProcessManager";

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
