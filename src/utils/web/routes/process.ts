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
    const { manager } = router.config;

    // List all processes
    router.addRoute('GET', '/processes', async () => {
        return Response.json({
            success: true,
            data: router.getStatusesWithStats()
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

    // Get all process logs combined (from in-memory buffers)
    router.addRoute('GET', '/logs', async (req) => {
        const limit = parseInt(new URL(req.url).searchParams.get('limit') || '50');
        const statuses = (router as any).getStatusesWithStats();

        const allLogs: any[] = [];
        for (const status of statuses) {
            const entries = manager.getProcessLogs(status.name, limit);
            for (const e of entries) {
                allLogs.push({ ...e, processName: status.name });
            }
        }
        // Sort by timestamp ascending, then cap to limit
        allLogs.sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);

        return Response.json({
            success: true,
            data: { logs: allLogs.slice(-limit) }
        });
    });

    // Get process logs (from in-memory buffer)
    router.addRoute('GET', '/processes/:name/logs', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
            }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const limit = parseInt(new URL(req.url).searchParams.get('limit') || '100');
        const logs = manager.getProcessLogs(name, limit);

        return Response.json({
            success: true,
            data: {
                processName: name,
                logs,
                limit,
                count: logs.length
            }
        });
    });

    // Send stdin input to a process
    router.addRoute('POST', '/processes/:name/input', async (req, params) => {
        const name = params?.['name'];
        if (!name || !isValidProcessName(name)) {
            return Response.json({ 
                success: false, 
                error: "Invalid process name" 
            }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        let input: string;
        try {
            const body = await req.json() as { input?: string };
            input = body.input ?? '';
        } catch {
            return Response.json({ success: false, error: 'Request body must be JSON with an "input" field' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        if (!input) {
            return Response.json({ success: false, error: '"input" field is required' }, { status: HTTP_STATUS.BAD_REQUEST });
        }

        const ok = manager.sendProcessInput(name, input);
        if (!ok) {
            return Response.json({ success: false, error: 'Process not found or stdin not available' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
        }

        return Response.json({ success: true, message: `Input sent to ${name}` });
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
}
