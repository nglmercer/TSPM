import { join, isAbsolute, resolve } from "path";
import { stat } from "fs/promises";
import { API, HTTP_STATUS } from "../../constants";
import type { Router } from "../router";
import type { ProcessStatusWithStats } from "../types";
import { eventLogger } from "../../logger";

export function registerSystemRoutes(router: Router) {
    const { manager } = router.config;

    // Status endpoint
    router.addRoute('GET', '/status', async () => {
        const statuses = router.getStatusesWithStats();
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

            // Color-test command for debugging
            if (command === 'color-test') {
                return Response.json({
                    success: true,
                    output: "\x1b[1;31mTSPM\x1b[0m \x1b[32mCOLOR\x1b[0m \x1b[34mTEST\x1b[0m \x1b[33mSUCCESSFUL\x1b[0m",
                    error: "",
                    exitCode: 0,
                    cwd: currentCwd
                });
            }

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

            // Command Processor: Force colors for common commands
            let processedCommand = command;
            const forceColorMap: Record<string, string> = {
                'ls': 'ls --color=always',
                'grep': 'grep --color=always',
                'dir': 'dir --color=always',
                'vdir': 'vdir --color=always',
                'git': 'git -c color.ui=always',
                'diff': 'diff --color=always',
                'ip': 'ip -c',
                'dmesg': 'dmesg --color=always'
            };

            const cmdMatch = command.match(/^([a-zA-Z0-9_-]+)/);
            if (cmdMatch && cmdMatch[1]) {
                const baseCmd = cmdMatch[1];
                const forced = forceColorMap[baseCmd];
                if (forced && !command.includes('--color') && !command.includes('-c color.ui')) {
                    processedCommand = command.replace(baseCmd, forced);
                }
            }

            // Run other commands in a shell to support builtins, pipes, etc.
            const proc = Bun.spawn(["sh", "-c", processedCommand], {
                cwd: currentCwd,
                stdout: "pipe",
                stderr: "pipe",
                env: {
                    ...process.env,
                    FORCE_COLOR: "1",
                    TERM: "xterm-256color",
                    COLORTERM: "truecolor",
                    CLICOLOR_FORCE: "1",
                    CLICOLOR: "1"
                }
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
        const statuses = router.getStatusesWithStats() as ProcessStatusWithStats[];
        
        // Trigger stats collection for running processes
        for (const status of statuses) {
            if (status.state === 'running') {
                const proc = router.config.manager.getProcess(status.name);
                if (proc) {
                    proc.getStats().catch(() => {}); // Fire and forget
                }
            }
        }
        
        // Get updated stats after collection
        const updatedStatuses = router.getStatusesWithStats() as ProcessStatusWithStats[];
        
        let totalCpu = 0;
        let totalMem = 0;
        let running = 0;
        let stopped = 0;
        let errored = 0;

        updatedStatuses.forEach(p => {
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
                    total: updatedStatuses.length,
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

    // Autocomplete endpoint
    router.addRoute('POST', '/autocomplete', async (req) => {
        try {
            const { prefix = '', cwd = process.cwd() } = await req.json() as { prefix: string, cwd: string };
            
            // Basic path completion
            let searchDir = cwd;
            let filePrefix = prefix;

            if (prefix.includes('/') || prefix.includes('\\')) {
                const lastSep = Math.max(prefix.lastIndexOf('/'), prefix.lastIndexOf('\\'));
                const pathPart = prefix.substring(0, lastSep + 1);
                filePrefix = prefix.substring(lastSep + 1);
                searchDir = isAbsolute(pathPart) ? pathPart : resolve(cwd, pathPart);
            }

            try {
                const entries = await (await import("fs/promises")).readdir(searchDir, { withFileTypes: true });
                const suggestions = entries
                    .filter(e => e.name.startsWith(filePrefix))
                    .map(e => e.name + (e.isDirectory() ? '/' : ''));
                
                return Response.json({ success: true, suggestions });
            } catch (e) {
                return Response.json({ success: true, suggestions: [] });
            }
        } catch (e: any) {
            return Response.json({ success: false, error: e.message });
        }
    });
}
