/**
 * Embedded Web Dashboard Assets
 * 
 * This module provides access to the web dashboard files when running
 * as a compiled standalone executable. The files are embedded into the
 * binary at build time.
 * 
 * When running in development (non-compiled), this module returns null,
 * and the server falls back to serving from the filesystem.
 */

/**
 * Check if we're running as a compiled standalone executable
 */
export function isCompiled(): boolean {
    // In compiled mode, import.meta.url starts with file://$bunfs/
    return import.meta.url.includes('$bunfs');
}

/**
 * Get embedded files as a map of filename -> Blob
 * Returns null if not running in compiled mode or no embedded files exist.
 */
export function getEmbeddedAssets(): Map<string, Blob> | null {
    if (!isCompiled()) return null;

    try {
        const assets = new Map<string, Blob>();
        
        // Bun.embeddedFiles contains all files embedded via `with { type: "file" }`
        // Each entry is a Blob with a `name` property (Bun-specific extension)
        for (const blob of Bun.embeddedFiles) {
            const blobName = (blob as Blob & { name: string }).name;
            // Remove content hash from filename: "index-a1b2c3d4.js" -> "index.js"
            const name = blobName.replace(/-[a-f0-9]+\./, '.');
            assets.set(name, blob);
        }

        return assets.size > 0 ? assets : null;
    } catch {
        return null;
    }
}

/**
 * Get MIME type for a file extension
 */
export function getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        'html': 'text/html; charset=utf-8',
        'js': 'application/javascript; charset=utf-8',
        'css': 'text/css; charset=utf-8',
        'json': 'application/json; charset=utf-8',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
}
