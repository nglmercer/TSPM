/**
 * Deploy command - Remote deployment with SSH
 * @module cli/commands/deploy
 */

import { getConfigManager } from '../../core/types';
import { deploy, validateDeploymentConfig } from '../../utils/deployment';
import type { DeploymentEnvConfig } from '../../utils/config/schema';

/**
 * Deploy command options
 */
export interface DeployCommandOptions {
  /** Environment to deploy to (staging, production, etc.) */
  environment?: string;
  /** Configuration file path */
  config?: string;
  /** Git repository URL (overrides config) */
  repo?: string;
  /** Local path to deploy from (alternative to git) */
  localPath?: string;
  /** Verbose output */
  verbose?: boolean;
}

/**
 * Deploy command handler
 * Deploys application to remote server via SSH
 */
export async function deployCommand(options: DeployCommandOptions = {}): Promise<void> {
  const { environment = 'production', config: configPath, repo, localPath, verbose = false } = options;

  try {
    // Load configuration
    const configManager = getConfigManager();
    const config = configPath
      ? await configManager.load(configPath)
      : await configManager.load();

    // Check if deployment is configured
    if (!config.deploy) {
      console.error('❌ No deployment configuration found in config file');
      console.error('Add a "deploy" section to your tspm.yaml/json file');
      console.error('\nExample:');
      console.error(`
deploy:
  repo: https://github.com/user/repo.git
  environments:
    production:
      host: example.com
      user: deploy
      path: /var/www/app
      key: ~/.ssh/deploy_key
      preDeploy:
        - npm install
        - npm run build
      postDeploy:
        - tspm restart --all
`);
      process.exit(1);
    }

    // Get environment configuration
    const envConfig = config.deploy.environments?.[environment] as DeploymentEnvConfig | undefined;

    if (!envConfig) {
      console.error(`❌ Environment "${environment}" not found in deployment configuration`);
      console.error(`Available environments: ${Object.keys(config.deploy.environments || {}).join(', ')}`);
      process.exit(1);
    }

    // Validate configuration
    const validation = validateDeploymentConfig(envConfig);
    if (!validation.valid) {
      console.error(`❌ Invalid deployment configuration for "${environment}":`);
      validation.errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }

    // Show deployment info
    console.log(`\n🚀 Deploying to ${environment}`);
    console.log(`   Host: ${envConfig.user}@${envConfig.host}`);
    console.log(`   Path: ${envConfig.path}`);
    console.log(`   Port: ${envConfig.port || 22}`);
    
    if (repo || config.deploy.repo) {
      console.log(`   Repo: ${repo || config.deploy.repo}`);
      console.log(`   Ref:  ${envConfig.ref || 'main'}`);
    } else if (localPath) {
      console.log(`   Local: ${localPath}`);
    }

    console.log('');

    // Perform deployment
    const result = await deploy({
      environment,
      config: envConfig,
      repo: repo || config.deploy.repo,
      localPath,
      verbose,
    });

    if (!result.success) {
      console.error(`\n❌ Deployment failed: ${result.error}`);
      if (verbose && result.output.length > 0) {
        console.error('\nOutput:');
        result.output.forEach((line) => console.error(line));
      }
      process.exit(1);
    }

    console.log(`\n✅ Deployment completed successfully in ${(result.duration / 1000).toFixed(2)}s`);

    if (verbose && result.output.length > 0) {
      console.log('\nOutput:');
      result.output.forEach((line) => console.log(line));
    }
  } catch (error) {
    console.error('❌ Deployment error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
