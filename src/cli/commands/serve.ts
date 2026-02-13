import { existsSync, statSync, readdirSync, createReadStream } from 'fs';
import { join, extname, resolve, normalize } from 'path';
import { createServer, type Server } from 'http';
import { log } from '../../utils/logger';
import { EXIT_CODES, APP_CONSTANTS } from '../../utils/config/constants';

/**
 * MIME types for common file extensions
 */
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.jsx': 'application/javascript',
};

/**
 * Default files to look for when serving a directory
 */
const DEFAULT_FILES = ['index.html', 'index.htm', 'index.html'];

/**
 * Get MIME type for a file extension
 */
function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Serve command - Static file server
 * 
 * This command starts a simple HTTP server to serve static files
 * from a specified directory, similar to PM2's serve command.
 */
export function serveCommand(
  path: string,
  options: { port?: number; spa?: boolean; cors?: boolean }
): void {
  const servePath = resolve(path || '.');
  const port = options.port || 8080;
  const spa = options.spa || false;
  const cors = options.cors || false;

  // Validate path exists
  if (!existsSync(servePath)) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Path does not exist: ${servePath}`);
    process.exit(EXIT_CODES.ERROR);
  }

  const isDirectory = statSync(servePath).isDirectory();
  if (!isDirectory) {
    log.error(`${APP_CONSTANTS.LOG_PREFIX} Path is not a directory: ${servePath}`);
    process.exit(EXIT_CODES.ERROR);
  }

  log.info(`${APP_CONSTANTS.LOG_PREFIX} Starting static file server...`);
  log.info(`${APP_CONSTANTS.LOG_PREFIX} Serving files from: ${servePath}`);
  log.info(`${APP_CONSTANTS.LOG_PREFIX} Port: ${port}`);
  if (spa) {
    log.info(`${APP_CONSTANTS.LOG_PREFIX} SPA mode enabled (fallback to index.html)`);
  }
  if (cors) {
    log.info(`${APP_CONSTANTS.LOG_PREFIX} CORS enabled`);
  }

  const server = createServer((req, res) => {
    // Parse URL and decode URI components
    let urlPath = decodeURIComponent(req.url?.split('?')[0] || '/');
    
    // Security: Prevent directory traversal
    if (urlPath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    // Normalize path
    urlPath = normalize(urlPath);
    
    // Remove leading slash
    const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
    let filePath = join(servePath, relativePath);

    // Add CORS headers if enabled
    if (cors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Only allow GET and HEAD methods
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('405 Method Not Allowed');
      return;
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      // SPA mode: serve index.html for any not found route
      if (spa) {
        const indexPath = join(servePath, 'index.html');
        if (existsSync(indexPath)) {
          serveFile(indexPath, res, req.method === 'HEAD');
          return;
        }
      }
      
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const stats = statSync(filePath);

    // If directory, look for default file
    if (stats.isDirectory()) {
      // Try default files
      for (const defaultFile of DEFAULT_FILES) {
        const defaultPath = join(filePath, defaultFile);
        if (existsSync(defaultPath)) {
          serveFile(defaultPath, res, req.method === 'HEAD');
          return;
        }
      }

      // List directory contents
      const files = readdirSync(filePath);
      const fileList = files
        .map(f => {
          const isDir = statSync(join(filePath, f)).isDirectory();
          return `<li><a href="${join(relativePath, f)}">${f}${isDir ? '/' : ''}</a></li>`;
        })
        .join('\n');

      const html = `<!DOCTYPE html>
<html>
<head><title>Index of ${urlPath}</title></head>
<body>
<h1>Index of ${urlPath}</h1>
<ul>
${relativePath ? '<li><a href="../">../</a></li>' : ''}
${fileList}
</ul>
</body>
</html>`;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    // Serve file
    serveFile(filePath, res, req.method === 'HEAD');
  });

  server.listen(port, () => {
    log.success(`${APP_CONSTANTS.LOG_PREFIX} Server running at http://localhost:${port}/`);
    log.info(`${APP_CONSTANTS.LOG_PREFIX} Press Ctrl+C to stop`);
  });

  // Handle server errors
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Port ${port} is already in use`);
      process.exit(EXIT_CODES.ERROR);
    } else {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Server error: ${err.message}`);
      process.exit(EXIT_CODES.ERROR);
    }
  });

  // Graceful shutdown
  setupGracefulShutdown(server, port);
}

/**
 * Serve a file with proper headers
 */
function serveFile(filePath: string, res: any, headOnly: boolean): void {
  const stats = statSync(filePath);
  const mimeType = getMimeType(filePath);

  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': stats.size,
    'Last-Modified': stats.mtime.toUTCString(),
  });

  if (headOnly) {
    res.end();
    return;
  }

  const fileStream = createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
  });
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: Server, port: number): void {
  const shutdown = () => {
    log.info(`\n${APP_CONSTANTS.LOG_PREFIX} Shutting down server...`);
    server.close(() => {
      log.success(`${APP_CONSTANTS.LOG_PREFIX} Server stopped`);
      process.exit(0);
    });

    // Force close after 5 seconds
    setTimeout(() => {
      log.error(`${APP_CONSTANTS.LOG_PREFIX} Forced shutdown`);
      process.exit(1);
    }, 5000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
