import { join, isAbsolute, resolve } from "path";
import { stat } from "fs/promises";
import { API, HTTP_STATUS } from "../../constants";
import type { Router } from "../router";
import type { ProcessStatusWithStats } from "../types";
import { eventLogger } from "../../logger";

export function registerSystemRoutes(router: Router) {
    const { manager } = (router as any).config;

    // Status endpoint
    router.addRoute('GET', '/status', async () => {
        const statuses = (router as any).getStatusesWithStats();
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
    router.addRoute('POST', '/execute', async (req) => {
        try {
            const body = await req.json() as { command?: string; cwd?: string };
            const { command, cwd } = body;
            
            if (!command) {
                return Response.json({ 
                    success: false, 
                    error: "Command required" 
                }, { status: HTTP_STATUS.BAD_REQUEST });
            }

            const currentCwd = cwd || process.cwd();

            // Handle 'cd' command specially to track state on client
            if (command.startsWith('cd ') || command === 'cd') {
                let targetDir = command.trim() === 'cd' ? (process.env.HOME || "/") : command.substring(3).trim();
                
                // Expand ~ to home directory
                if (targetDir.startsWith('~')) {
                    const home = process.env.HOME || "/";
                    targetDir = targetDir.replace('~', home);
                }
                
                const absolutePath = isAbsolute(targetDir) ? resolve(targetDir) : resolve(currentCwd, targetDir);
                
                try {
                    const stats = await stat(absolutePath);
                    if (stats.isDirectory()) {
                        return Response.json({ 
                            success: true, 
                            output: "", 
                            error: "",
                            exitCode: 0,
                            newCwd: absolutePath
                        });
                    } else {
                        throw new Error(`Not a directory: ${targetDir}`);
                    }
                } catch (e: any) {
                    return Response.json({ 
                        success: false, 
                        error: `cd: ${e.message}`
                    });
                }
            }

            // Run other commands in a shell to support builtins, pipes, etc.
            const proc = Bun.spawn(["sh", "-c", command], {
                cwd: currentCwd,
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
                exitCode: proc.exitCode,
                cwd: currentCwd
            });
        } catch (e: any) {
            return Response.json({ 
                success: false, 
                error: e.message 
            }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
        }
    });

    // Get system stats
    router.addRoute('GET', '/stats', async () => {
        const statuses = (router as any).getStatusesWithStats() as ProcessStatusWithStats[];
        
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
                uptime: process.uptime() * 1000,
                cwd: process.cwd()
            }
        });
    });

    // Health check
    router.addRoute('GET', '/health', async () => {
        return Response.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    });

    // Get historical events
    router.addRoute('GET', '/events', async (req) => {
        const limit = parseInt(new URL(req.url).searchParams.get('limit') || '50');
        const events = await eventLogger.getRecent(limit);
        
        return Response.json({
            success: true,
            data: events
        });
    });
}
