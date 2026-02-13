
import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from 'bun:test';
import { checkTcpPort, checkHttp, checkCommand } from '../../../src/utils/healthcheck/strategies'; // Note traverse up one step
import { HTTP_METHODS } from '../../../src/utils/config/constants';

// Mock fetch
const originalFetch = global.fetch;
const originalBunConnect = Bun.connect;
const originalBunSpawn = Bun.spawn;

describe('HealthCheck Strategies', () => {

  beforeEach(() => {
    // Reset mocks
    global.fetch = mock(() => Promise.resolve(new Response('OK')));
    
    // Mock Bun.connect
    Bun.connect = mock(() => Promise.resolve({
        end: mock(),
        write: mock(),
        // other socket methods
    }));

    // Mock Bun.spawn
    Bun.spawn = mock(() => ({
        exited: Promise.resolve(0),
        stdout: new ReadableStream(),
        stderr: new ReadableStream(),
        kill: mock(),
        unref: mock(),
    }));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Bun.connect = originalBunConnect;
    Bun.spawn = originalBunSpawn;
    mock.restore();
  });

  describe('checkTcpPort', () => {
    it('should return true when connection succeeds', async () => {
      const result = await checkTcpPort('localhost', 8080, 100);
      expect(result).toBe(true);
      expect(Bun.connect).toHaveBeenCalled();
    });

    it('should return false when connection fails', async () => {
      Bun.connect = mock(() => Promise.reject(new Error('Connection refused')));
      const result = await checkTcpPort('localhost', 8080, 100);
      expect(result).toBe(false);
    });
  });

  describe('checkHttp', () => {
    it('should return success for 200 OK', async () => {
        global.fetch = mock(() => Promise.resolve(new Response('OK', { status: 200 })));
        
        const result = await checkHttp('http', 'localhost', 8080, '/', HTTP_METHODS.GET, {}, 100);
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
    });

    it('should return failure for unexpected status code', async () => {
        global.fetch = mock(() => Promise.resolve(new Response('Bad Request', { status: 400 })));
        
        const result = await checkHttp('http', 'localhost', 8080, '/', HTTP_METHODS.GET, {}, 100, 200);
        expect(result.success).toBe(false);
        expect(result.statusCode).toBe(400);
        expect(result.error).toContain('Expected status 200');
    });

    it('should validate response body', async () => {
        global.fetch = mock(() => Promise.resolve(new Response('{"status":"ok"}', { status: 200 })));
        
        const result = await checkHttp('http', 'localhost', 8080, '/', HTTP_METHODS.GET, {}, 100, 200, 'ok');
        expect(result.success).toBe(true);
    });

    it('should fail if body does not match', async () => {
        global.fetch = mock(() => Promise.resolve(new Response('{"status":"error"}', { status: 200 })));
        
        const result = await checkHttp('http', 'localhost', 8080, '/', HTTP_METHODS.GET, {}, 100, 200, 'ok');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Response body does not contain');
    });
    
    it('should handle network errors', async () => {
        global.fetch = mock(() => Promise.reject(new Error('Network error')));
        
        const result = await checkHttp('http', 'localhost', 8080, '/', HTTP_METHODS.GET, {}, 100);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Network error');
    });
  });

  describe('checkCommand', () => {
    it('should return success when command exits with 0', async () => {
        const result = await checkCommand('echo ok', 100);
        expect(result.success).toBe(true);
        expect(Bun.spawn).toHaveBeenCalled();
    });

    it('should return failure when command exits with non-zero', async () => {
        Bun.spawn = mock(() => ({
            exited: Promise.resolve(1),
            stdout: new ReadableStream(),
            stderr: new ReadableStream(),
            kill: mock(),
            unref: mock(),
        }));

        const result = await checkCommand('exit 1', 100);
        expect(result.success).toBe(false);
        expect(result.error).toContain('exited with code 1');
    });
    
    it('should handle spawn errors', async () => {
        Bun.spawn = mock(() => { throw new Error('Spawn failed') });

        const result = await checkCommand('invalid', 100);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Spawn failed');
    });
  });
});
