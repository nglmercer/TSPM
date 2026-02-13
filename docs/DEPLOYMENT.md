# TSPM Deployment System

Phase 7.4 feature - Remote deployment via SSH with pre/post hooks and multi-environment support.

## Overview

TSPM now supports deploying your applications to remote servers via SSH. This feature includes:

- **Git-based deployment**: Deploy from a Git repository
- **Rsync-based deployment**: Deploy from a local directory
- **Pre-deploy hooks**: Run commands before deployment
- **Post-deploy hooks**: Run commands after deployment
- **Multi-environment support**: Configure staging, production, and more
- **Environment-specific variables**: Set variables per environment

## Configuration

Add deployment configuration to your `tspm.yaml` or `tspm.json` file:

```yaml
# Your application processes
processes:
  - name: my-app
    script: bun
    args: [run, src/index.ts]
    instances: 2

# Deployment configuration
deploy:
  # Git repository URL (optional if using local deployment)
  repo: https://github.com/username/repo.git

  # Environment configurations
  environments:
    # Production environment
    production:
      host: prod.example.com # Remote host
      user: deploy # SSH user
      port: 22 # SSH port (optional, default: 22)
      key: ~/.ssh/deploy_key # SSH key path (optional)
      path: /var/www/production # Remote deployment path
      ref: main # Git branch/tag/commit (optional, default: main)

      # Pre-deploy hooks (run before deployment)
      preDeploy:
        - npm ci
        - npm run build
        - npm test

      # Post-deploy hooks (run after deployment)
      postDeploy:
        - cd /var/www/production
        - tspm restart --all
        - curl -X POST https://api.example.com/webhooks/deploy

      # Environment-specific variables
      env:
        NODE_ENV: production
        PORT: "3000"

    # Staging environment
    staging:
      host: staging.example.com
      user: deploy
      path: /var/www/staging
      ref: develop

      preDeploy:
        - npm install
        - npm run build:staging

      postDeploy:
        - tspm restart --all

      env:
        NODE_ENV: staging
        PORT: "4000"
```

## Usage

### Deploy to an Environment

```bash
# Deploy to production (default)
tspm deploy

# Deploy to specific environment
tspm deploy staging

# Deploy with verbose output
tspm deploy production -v

# Override git repository
tspm deploy production --repo https://github.com/user/other-repo.git

# Deploy from local directory (uses rsync)
tspm deploy production --local ./dist
```

### Command Options

```bash
tspm deploy [environment] [options]

Arguments:
  environment          Environment to deploy to (default: production)

Options:
  -c, --config <file>  Configuration file path
  --repo <url>         Git repository URL (overrides config)
  --local <path>       Local path to deploy from (alternative to git)
  -v, --verbose        Verbose output
  -h, --help           Display help
```

## Deployment Methods

### Git-based Deployment

When using git-based deployment, TSPM will:

1. SSH into the remote server
2. Check if the repository is already cloned
3. If yes: fetch and pull the latest changes
4. If no: clone the repository
5. Checkout the specified branch/tag/commit

```yaml
deploy:
  repo: https://github.com/username/repo.git
  environments:
    production:
      host: example.com
      user: deploy
      path: /var/www/app
      ref: v1.0.0 # Can be branch, tag, or commit
```

### Rsync-based Deployment

When using local deployment with rsync, TSPM will:

1. Sync the local directory to the remote server
2. Use SSH for secure transfer
3. Delete files on remote that don't exist locally (--delete flag)

```bash
tspm deploy production --local ./dist
```

## Hooks

### Pre-deploy Hooks

Pre-deploy hooks run **before** the code is deployed. Common use cases:

- Install dependencies
- Build the application
- Run tests
- Database migrations (with caution)

```yaml
preDeploy:
  - npm ci
  - npm run build
  - npm test
```

### Post-deploy Hooks

Post-deploy hooks run **after** the code is deployed. Common use cases:

- Restart application processes
- Clear caches
- Send notifications
- Update services

```yaml
postDeploy:
  - cd /var/www/app
  - tspm restart --all
  - curl -X POST https://webhooks.example.com/deploy
  - systemctl reload nginx
```

### Hook Format

Hooks can be a single command string or an array of commands:

```yaml
# Single command
preDeploy: npm run build

# Multiple commands
preDeploy:
  - npm ci
  - npm run build
  - npm test
```

## Environment Variables

Set environment-specific variables that will be available during hook execution:

```yaml
environments:
  production:
    env:
      NODE_ENV: production
      PORT: "3000"
      DATABASE_URL: postgres://prod-db.example.com
```

## SSH Configuration

### Using SSH Keys

Specify an SSH key for authentication:

```yaml
production:
  host: example.com
  user: deploy
  key: ~/.ssh/production_deploy_key
```

### SSH Port

Use a custom SSH port:

```yaml
production:
  host: example.com
  user: deploy
  port: 2222
```

### SSH Config File

You can also configure SSH in your `~/.ssh/config` file:

```
Host prod-server
  HostName example.com
  User deploy
  Port 22
  IdentityFile ~/.ssh/deploy_key
```

Then use the alias in your TSPM config:

```yaml
production:
  host: prod-server
  user: deploy
  path: /var/www/app
```

## Best Practices

### 1. Use Separate Deploy Keys

Generate separate SSH keys for deployment:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "deploy@example.com"
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@example.com
```

### 2. Test in Staging First

Always deploy to staging before production:

```bash
tspm deploy staging -v
# Test the staging environment
tspm deploy production -v
```

### 3. Use Git Tags for Production

Deploy specific versions to production:

```yaml
production:
  ref: v1.2.3 # Use semantic versioning tags
```

### 4. Backup Before Deployment

Include backup commands in pre-deploy hooks:

```yaml
preDeploy:
  - cd /var/www/app
  - tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .
  - npm ci
  - npm run build
```

### 5. Health Check After Deployment

Verify deployment success in post-deploy hooks:

```yaml
postDeploy:
  - tspm restart --all
  - sleep 5
  - curl -f http://localhost:3000/health || exit 1
```

## Troubleshooting

### SSH Connection Issues

If you get SSH connection errors:

1. Test SSH manually: `ssh deploy@example.com`
2. Check SSH key permissions: `chmod 600 ~/.ssh/deploy_key`
3. Use verbose mode: `tspm deploy production -v`

### Permission Errors

If you get permission errors on the remote server:

1. Ensure the deploy user owns the deployment directory:

   ```bash
   sudo chown -R deploy:deploy /var/www/app
   ```

2. Verify directory permissions:
   ```bash
   ls -la /var/www/app
   ```

### Hook Failures

If hooks fail:

1. Use verbose mode to see output: `tspm deploy production -v`
2. Test hooks manually on the server
3. Check environment variables
4. Verify paths in hook commands

## Security Considerations

1. **Never commit SSH keys to version control**
2. **Use separate deploy users with limited permissions**
3. **Restrict SSH key access** - use keys with specific purposes
4. **Use HTTPS for Git repositories** when possible
5. **Validate inputs** in hook scripts
6. **Rotate deploy keys** regularly
7. **Use firewall rules** to restrict SSH access

## Example Workflows

### Simple Node.js App

```yaml
deploy:
  repo: https://github.com/user/app.git
  environments:
    production:
      host: example.com
      user: deploy
      path: /var/www/app

      preDeploy:
        - npm ci
        - npm run build

      postDeploy:
        - pm2 restart app
```

### Bun Application with TSPM

```yaml
deploy:
  repo: https://github.com/user/bun-app.git
  environments:
    production:
      host: example.com
      user: deploy
      path: /opt/apps/my-app

      preDeploy:
        - bun install
        - bun run build

      postDeploy:
        - tspm restart --all
```

### Static Site with Nginx

```yaml
deploy:
  repo: https://github.com/user/website.git
  environments:
    production:
      host: example.com
      user: www-data
      path: /var/www/html

      preDeploy:
        - npm ci
        - npm run build

      postDeploy:
        - systemctl reload nginx
```

## Related Commands

- `tspm start` - Start processes
- `tspm restart` - Restart processes
- `tspm stop` - Stop processes
- `tspm list` - List running processes
- `tspm monit` - Monitor processes

## See Also

- [TSPM Configuration Guide](../README.md)
- [Process Management](../README.md#process-management)
- [SSH Documentation](https://www.openssh.com/)
