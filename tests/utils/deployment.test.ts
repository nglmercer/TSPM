/**
 * Tests for deployment utilities
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { validateDeploymentConfig } from '../../src/utils/deployment';
import type { DeploymentEnvConfig } from '../../src/utils/config/schema';

describe('Deployment', () => {
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
      const config = {
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
});
