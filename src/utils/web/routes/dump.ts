import { HTTP_STATUS } from "../../constants";
import type { Router } from "../router";
import { PersistenceManager } from "../../persistence";
import type { ProcessConfig } from "../../../core/types";

/**
 * Routes for reading and modifying the persisted dump.json state.
 *
 * GET    /dump           → return full contents of .tspm/dump.json
 * PUT    /dump           → replace the entire dump.json (re-registers all processes)
 * PATCH  /dump/:name     → update (merge) a single process entry by name
 * DELETE /dump/:name     → remove a single process entry by name
 */
export function registerDumpRoutes(router: Router) {
    const { manager } = router.config;

    // ─── GET /dump ────────────────────────────────────────────────────────────
    // Return the full persisted state as-is from .tspm/dump.json
    router.addRoute('GET', '/dump', async () => {
        const data = PersistenceManager.load();
        return Response.json({
            success: true,
            data: data ?? { processes: [] }
        });
    });

    // ─── PUT /dump ────────────────────────────────────────────────────────────
    // Replace the entire dump.json with the provided payload and reload processes
    router.addRoute('PUT', '/dump', async (req) => {
        let body: { processes?: ProcessConfig[] };
        try {
            body = await req.json() as { processes?: ProcessConfig[] };
        } catch {
            return Response.json(
                { success: false, error: 'Invalid JSON body' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        if (!Array.isArray(body?.processes)) {
            return Response.json(
                { success: false, error: '"processes" array is required' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        // Validate each entry has at minimum a name and script field
        for (const proc of body.processes) {
            if (!proc.name || !proc.script) {
                return Response.json(
                    { success: false, error: `Each process must have "name" and "script". Got: ${JSON.stringify(proc)}` },
                    { status: HTTP_STATUS.BAD_REQUEST }
                );
            }
        }

        // Persist to disk
        PersistenceManager.save({ processes: body.processes });

        // Update in-memory manager for each process
        for (const proc of body.processes) {
            await manager.addProcess(proc, false);
        }

        return Response.json({
            success: true,
            message: `Dump updated with ${body.processes.length} process(es)`,
            data: { processes: body.processes }
        });
    });

    // ─── PATCH /dump/:name ────────────────────────────────────────────────────
    // Merge-update a single process entry in dump.json by its name.
    // Only modifies the persisted file — does NOT restart the live process.
    router.addRoute('PATCH', '/dump/:name', async (req, params) => {
        const name = params?.['name'];
        if (!name) {
            return Response.json(
                { success: false, error: 'Process name is required' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        let patch: Partial<ProcessConfig>;
        try {
            patch = await req.json() as Partial<ProcessConfig>;
        } catch {
            return Response.json(
                { success: false, error: 'Invalid JSON body' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        const data = PersistenceManager.load() ?? { processes: [] };
        if (!Array.isArray(data.processes)) data.processes = [];

        const idx = (data.processes as ProcessConfig[]).findIndex((p: ProcessConfig) => p.name === name);
        if (idx === -1) {
            return Response.json(
                { success: false, error: `Process "${name}" not found in dump` },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        // Merge the patch into the existing entry
        const oldName = name;
        const newName = patch.name || oldName;

        const updated: ProcessConfig = { ...data.processes[idx], ...patch };
        
        // If rename occurred
        if (newName !== oldName) {
            // Check if new name already exists elsewhere
            const collisionIdx = data.processes.findIndex((p: any) => p.name === newName);
            if (collisionIdx !== -1 && collisionIdx !== idx) {
                return Response.json(
                    { success: false, error: `Process with name "${newName}" already exists` },
                    { status: HTTP_STATUS.BAD_REQUEST }
                );
            }

            // Remove old process registration from manager before adding new one
            try {
                await manager.removeProcess(oldName);
            } catch (e) {
                // It might not be running or registered, which is fine for a dump-only rename
            }
        }

        data.processes[idx] = updated;
        PersistenceManager.save(data);

        // Update in-memory manager registry with the new config (overwrites old index if name is same, or adds new one if renamed)
        await manager.addProcess(updated, false);

        return Response.json({
            success: true,
            message: `Process "${name}" updated in dump`,
            data: updated
        });
    });

    // ─── DELETE /dump/:name ───────────────────────────────────────────────────
    // Remove a single process entry from dump.json by name.
    // Also stops the process if it's currently running.
    router.addRoute('DELETE', '/dump/:name', async (req, params) => {
        const name = params?.['name'];
        if (!name) {
            return Response.json(
                { success: false, error: 'Process name is required' },
                { status: HTTP_STATUS.BAD_REQUEST }
            );
        }

        const data = PersistenceManager.load() ?? { processes: [] };
        if (!Array.isArray(data.processes)) data.processes = [];

        const before = (data.processes as ProcessConfig[]).length;
        data.processes = (data.processes as ProcessConfig[]).filter((p: ProcessConfig) => p.name !== name);

        if (data.processes.length === before) {
            return Response.json(
                { success: false, error: `Process "${name}" not found in dump` },
                { status: HTTP_STATUS.NOT_FOUND }
            );
        }

        PersistenceManager.save(data);

        // Remove from manager (this also stops it)
        try {
            await manager.removeProcess(name);
        } catch (e) {
            // Log but don't fail the request if remove fails
            console.error(`Failed to remove process "${name}":`, e);
        }

        return Response.json({
            success: true,
            message: `Process "${name}" removed from dump`
        });
    });
}
