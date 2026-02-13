/**
 * Deployment module for TSPM
 * Handles remote deployments via SSH with pre/post hooks
 * @module utils/deployment
 */

import { spawn } from 'bun';
import { join } from 'path';
import { existsSync } from 'fs';
import type { DeploymentEnvConfig } from './config/schema';

/**
 * Deployment result
 */
export interface DeploymentResult {
  /** Whether deployment succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Deployment output */
  output: string[];
  /** Deployment duration in ms */
  duration: number;
}

/**
 * Deployment options
 */
export interface DeploymentOptions {
  /** Environment to deploy to */
  environment: string;
  /** Environment configuration */
  config: DeploymentEnvConfig;
  /** Git repository URL */
  repo?: string;
  /** Local directory to deploy from (if not using git) */
  localPath?: string;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Execute a command via SSH
 */
async function executeSSH(
  host: string,
  user: string,
  command: string,
  options: {
    port?: number;
    key?: string;
    verbose?: boolean;
  } = {}
): Promise<{ success: boolean; output: string; error?: string }> {
  const { port = 22, key, verbose = false } = options;

  const sshArgs: string[] = [
    '-p',
    port.toString(),
    '-o',
    'StrictHostKeyChecking=no',
    '-o',
    'UserKnownHostsFile=/dev/null',
  ];

  if (key && existsSync(key)) {
    sshArgs.push('-i', key);
  }

  sshArgs.push(`${user}@${host}`, command);

  if (verbose) {
    console.log(`[SSH] Executing: ssh ${sshArgs.join(' ')}`);
  }

  try {
    const proc = spawn(['ssh', ...sshArgs], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const output = await new Response(proc.stdout).text();
    const errorOutput = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      return {
        success: false,
        output: output || errorOutput,
        error: `SSH command failed with exit code ${exitCode}: ${errorOutput}`,
      };
    }

    return {
      success: true,
      output: output || errorOutput,
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: `SSH execution failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Execute commands (local or remote)
 */
async function executeCommands(
  commands: string | string[],
  host: string,
  user: string,
  options: {
    port?: number;
    key?: string;
    verbose?: boolean;
    env?: Record<string, string>;
  } = {}
): Promise<{ success: boolean; output: string[]; error?: string }> {
  const commandList = Array.isArray(commands) ? commands : [commands];
  const output: string[] = [];

  for (const command of commandList) {
    const envVars = options.env
      ? Object.entries(options.env)
          .map(([k, v]) => `export ${k}="${v}"`)
          .join(' && ')
      : '';

    const fullCommand = envVars ? `${envVars} && ${command}` : command;

    if (options.verbose) {
      console.log(`[Execute] ${fullCommand}`);
    }

    const result = await executeSSH(host, user, fullCommand, options);

    if (!result.success) {
      return {
        success: false,
        output: [...output, result.output],
        error: result.error,
      };
    }

    output.push(result.output);
  }

  return { success: true, output };
}

/**
 * Deploy to remote environment
 */
export async function deploy(options: DeploymentOptions): Promise<DeploymentResult> {
  const startTime = Date.now();
  const { environment, config, repo, localPath, verbose = false } = options;
  const output: string[] = [];

  try {
    const { host, user, port = 22, key, path: remotePath, preDeploy, postDeploy, env, ref = 'main' } = config;

    if (verbose) {
      console.log(`\n🚀 Deploying to ${environment} (${user}@${host}:${remotePath})`);
    }

    // Step 1: Run pre-deploy hooks
    if (preDeploy) {
      if (verbose) {
        console.log('\n📋 Running pre-deploy hooks...');
      }

      const preDeployResult = await executeCommands(preDeploy, host, user, {
        port,
        key,
        verbose,
        env,
      });

      if (!preDeployResult.success) {
        return {
          success: false,
          error: `Pre-deploy hooks failed: ${preDeployResult.error}`,
          output: [...output, ...preDeployResult.output],
          duration: Date.now() - startTime,
        };
      }

      output.push(...preDeployResult.output);
    }

    // Step 2: Deploy code
    if (verbose) {
      console.log('\n📦 Deploying code...');
    }

    if (repo) {
      // Git-based deployment
      const gitCommands = [
        `mkdir -p ${remotePath}`,
        `cd ${remotePath}`,
        // Check if repo already exists
        `if [ -d .git ]; then git fetch origin && git checkout ${ref} && git pull origin ${ref}; else git clone ${repo} . && git checkout ${ref}; fi`,
      ];

      const gitResult = await executeCommands(gitCommands, host, user, {
        port,
        key,
        verbose,
        env,
      });

      if (!gitResult.success) {
        return {
          success: false,
          error: `Git deployment failed: ${gitResult.error}`,
          output: [...output, ...gitResult.output],
          duration: Date.now() - startTime,
        };
      }

      output.push(...gitResult.output);
    } else if (localPath) {
      // rsync-based deployment
      if (!existsSync(localPath)) {
        return {
          success: false,
          error: `Local path does not exist: ${localPath}`,
          output,
          duration: Date.now() - startTime,
        };
      }

      const rsyncArgs = [
        '-avz',
        '--delete',
        '-e',
        `ssh -p ${port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null${key ? ` -i ${key}` : ''}`,
        localPath.endsWith('/') ? localPath : `${localPath}/`,
        `${user}@${host}:${remotePath}`,
      ];

      if (verbose) {
        console.log(`[Rsync] ${rsyncArgs.join(' ')}`);
      }

      try {
        const proc = spawn(['rsync', ...rsyncArgs], {
          stdout: 'pipe',
          stderr: 'pipe',
        });

        const rsyncOutput = await new Response(proc.stdout).text();
        const rsyncError = await new Response(proc.stderr).text();
        const exitCode = await proc.exited;

        if (exitCode !== 0) {
          return {
            success: false,
            error: `Rsync failed with exit code ${exitCode}: ${rsyncError}`,
            output: [...output, rsyncOutput || rsyncError],
            duration: Date.now() - startTime,
          };
        }

        output.push(rsyncOutput || rsyncError);
      } catch (error) {
        return {
          success: false,
          error: `Rsync execution failed: ${error instanceof Error ? error.message : String(error)}`,
          output,
          duration: Date.now() - startTime,
        };
      }
    } else {
      return {
        success: false,
        error: 'Either repo or localPath must be specified for deployment',
        output,
        duration: Date.now() - startTime,
      };
    }

    // Step 3: Run post-deploy hooks
    if (postDeploy) {
      if (verbose) {
        console.log('\n🔧 Running post-deploy hooks...');
      }

      const postDeployResult = await executeCommands(postDeploy, host, user, {
        port,
        key,
        verbose,
        env,
      });

      if (!postDeployResult.success) {
        return {
          success: false,
          error: `Post-deploy hooks failed: ${postDeployResult.error}`,
          output: [...output, ...postDeployResult.output],
          duration: Date.now() - startTime,
        };
      }

      output.push(...postDeployResult.output);
    }

    if (verbose) {
      console.log(`\n✅ Deployment to ${environment} completed successfully!`);
    }

    return {
      success: true,
      output,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: `Deployment failed: ${error instanceof Error ? error.message : String(error)}`,
      output,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Validate deployment configuration
 */
export function validateDeploymentConfig(config: DeploymentEnvConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.host || config.host.trim() === '') {
    errors.push('Host is required');
  }

  if (!config.user || config.user.trim() === '') {
    errors.push('User is required');
  }

  if (!config.path || config.path.trim() === '') {
    errors.push('Remote path is required');
  }

  if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
    errors.push('Port must be between 1 and 65535');
  }

  if (config.key && !existsSync(config.key)) {
    errors.push(`SSH key file not found: ${config.key}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
