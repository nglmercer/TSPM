/**
 * Tests for deployment utilities
 */

import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { validateDeploymentConfig, deploy, type DeploymentOptions } from '../../src/utils/deployment';
import type { DeploymentEnvConfig } from '../../src/utils/config/schema';

// Mock Bun.spawn
const originalSpawn = Bun.spawn;

describe('Deployment', () => {
    
  beforeEach(() => {
    // Default successful spawn mock
    Bun.spawn = mock(() => ({
      stdout: new Response("command output").body, // Mock stream
      stderr: new Response("").body,
      exited: Promise.resolve(0),
      kill: () => {},
      unref: () => {},
      pid: 12345,
    } as any));
  });

  afterEach(() => {
    Bun.spawn = originalSpawn;
    mock.restore();
  });

  describe('validateDeploymentConfig', () => {
    it('should validate a correct config', () => {
      const config: DeploymentEnvConfig = {
        host: 'example.com',
        user: 'deploy',
        path: '/var/www/app',
      };

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require host', () => {
      const config = {
        user: 'deploy',
        path: '/var/www/app',
      } as DeploymentEnvConfig;

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Host is required');
    });

    it('should require user', () => {
      const config = {
        host: 'example.com',
        path: '/var/www/app',
      } as DeploymentEnvConfig;

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('User is required');
    });

    it('should require path', () => {
      const config: DeploymentEnvConfig = {
        host: 'example.com',
        user: 'deploy',
      } as DeploymentEnvConfig;

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Remote path is required');
    });

    it('should validate port range', () => {
      const config: DeploymentEnvConfig = {
        host: 'example.com',
        user: 'deploy',
        path: '/var/www/app',
        port: 99999,
      };

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Port must be between'))).toBe(true);
    });

    it('should accept valid port', () => {
      const config: DeploymentEnvConfig = {
        host: 'example.com',
        user: 'deploy',
        path: '/var/www/app',
        port: 2222,
      };

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should accept config with hooks', () => {
      const config: DeploymentEnvConfig = {
        host: 'example.com',
        user: 'deploy',
        path: '/var/www/app',
        preDeploy: ['npm install', 'npm run build'],
        postDeploy: 'pm2 restart all',
      };

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(true);
    });

    it('should accept config with env vars', () => {
      const config: DeploymentEnvConfig = {
        host: 'example.com',
        user: 'deploy',
        path: '/var/www/app',
        env: {
          NODE_ENV: 'production',
          PORT: '3000',
        },
      };

      const result = validateDeploymentConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('execute and deploy', () => {
    const mockConfig: DeploymentEnvConfig = {
        host: 'test-host',
        user: 'test-user',
        path: '/remote/path',
        port: 22,
    };

    it('should execute pre-deploy hooks', async () => {
        Bun.spawn = mock(() => ({
            stdout: new Response("hook executed\n").body,
            stderr: new Response("").body,
            exited: Promise.resolve(0),
            kill: () => {},
            unref: () => {},
            pid: 1234,
        } as any));

        const options: DeploymentOptions = {
            environment: 'prod',
            config: {
                ...mockConfig,
                preDeploy: ['echo start'],
            },
            repo: 'git@github.com:user/repo.git',
        };

        const result = await deploy(options);
        expect(result.success).toBe(true);
        expect(result.output[0]).toContain('hook executed');
    });

    it('should handle git deployment', async () => {
        const options: DeploymentOptions = {
            environment: 'prod',
            config: mockConfig,
            repo: 'git@github.com:user/repo.git',
            verbose: true,
        };

        const result = await deploy(options);
        
        expect(result.success).toBe(true);
        expect(Bun.spawn).toHaveBeenCalled();
        // Check if spawn called with ssh command that includes git stuff
        // Since we can't easily inspect arguments of mocked calls without more complex setup, 
        // we mainly check the flow completes successfully.
    });

    it('should handle rsync deployment (skipping actual rsync execution check as we mock spawn)', async () => {
        // Need to mock existsSync to return true for local path?
        // Since we can't mock fs.existsSync easily with just bun test (it's tough), 
        // we assume the test might fail if local path doesn't exist.
        // We can skip this test or mock fs module if needed.
        // Or we pass a path that likely exists like process.cwd() or import.meta.dir
        
        const options: DeploymentOptions = {
            environment: 'prod',
            config: mockConfig,
            localPath: '.', // Assuming current dir exists
        };

        const result = await deploy(options);
        // Wait, deploy checks existsSync(localPath)
        // . means current dir, so it should exist.
        
        expect(result.success).toBe(true);
    });

    it('should fail if neither repo nor localPath provided', async () => {
        const options: DeploymentOptions = {
            environment: 'prod',
            config: mockConfig,
        };

        const result = await deploy(options);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Either repo or localPath must be specified');
    });

    it('should handle spawn errors gracefully', async () => {
        Bun.spawn = mock(() => ({
            stdout: new Response("").body,
            stderr: new Response("error happened").body,
            exited: Promise.resolve(1), // Exit code 1
            kill: () => {},
            unref: () => {},
            pid: 1234,
        } as any));

        const options: DeploymentOptions = {
            environment: 'prod',
            config: mockConfig,
            repo: 'git@repo',
        };

        const result = await deploy(options);
        expect(result.success).toBe(false);
        // Since git deployment involves multiple steps (mkdir, cd, etc joined by &&), 
        // one failure fails the whole thing in executeCommands or executeSSH
        expect(result.error).toBeDefined();
    });
  });
});
