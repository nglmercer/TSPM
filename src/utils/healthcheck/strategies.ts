import { type HttpMethod } from '../config/constants';

/**
 * TCP port checker
 */
export async function checkTcpPort(host: string, port: number, timeout: number): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      hostname: host,
      port,
      socket: {
        data() {},
        open() {},
        close() {},
        error() {},
      },
    });
    // We can't easily set a timeout on Bun.connect yet, so we hope it fails fast or use a wrapper
    // For now, let's keep it simple as it was in the original file
    socket.end();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * HTTP/HTTPS health checker
 */
export async function checkHttp(
  protocol: 'http' | 'https',
  host: string,
  port: number,
  path: string,
  method: HttpMethod,
  headers: Record<string, string> = {},
  timeout: number,
  expectedStatus?: number,
  responseBody?: string
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const url = `${protocol}://${host}:${port}${path}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: AbortSignal.timeout(timeout),
    });
    
    // Check status code
    if (expectedStatus && response.status !== expectedStatus) {
      return {
        success: false,
        statusCode: response.status,
        error: `Expected status ${expectedStatus}, got ${response.status}`,
      };
    }
    
    // Check response body if specified
    if (responseBody) {
      const body = await response.text();
      if (!body.includes(responseBody)) {
        return {
          success: false,
          statusCode: response.status,
          error: `Response body does not contain: ${responseBody}`,
        };
      }
    }
    
    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Command-based health checker
 */
export async function checkCommand(command: string, timeout: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await Bun.spawn({
      cmd: ['sh', '-c', command],
    }).exited;
    
    if (result === 0) {
      return { success: true };
    }
    
    return { success: false, error: `Command exited with code ${result}` };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Command failed' };
  }
}
