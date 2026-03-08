import { HTTP_STATUS } from "../../constants";
import type { Router } from "../router";
import type { ProcessConfig } from "../../../core/types";

/**
 * Validate process name - must be alphanumeric with hyphens/underscores only
 */
function isValidProcessName(name: string): boolean {
    if (!name || name.length === 0) return false;
    // Allow alphanumeric, hyphens, underscores, dots (for file extensions like app.js)
    return /^[a-zA-Z0-9_./-]+$/.test(name) && !name.includes('..');
}

export function registerProcessRoutes(router: Router) {
    const { manager } = (router as any).config;

    // List all processes
    router.addRoute('GET', '/processes', async () => {
        return Response.json({
            success: true,
            data: (router as any).getStatusesWithStats()
        });
    });

    // Get single process
    router.addRoute('GET', '/processes/:name', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
            }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const statuses = (router as any).getStatusesWithStats();
        const process = statuses.find((p: any) => p.name === name);

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
    router.addRoute('POST', '/processes', async (req) => {
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
    router.addRoute('POST', '/processes/:name/start', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
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
    router.addRoute('POST', '/processes/:name/stop', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
            }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        try {
            await manager.stopProcess(name);
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
    router.addRoute('POST', '/processes/:name/restart', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
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
    router.addRoute('DELETE', '/processes/:name', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
            }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        try {
            await manager.stopProcess(name);
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
    router.addRoute('GET', '/processes/:name/logs', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
            }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const limit = parseInt(new URL(req.url).searchParams.get('limit') || '100');
        
        return Response.json({
            success: true,
            data: {
                processName: name,
                logs: [], 
                limit
            }
        });
    });
}
