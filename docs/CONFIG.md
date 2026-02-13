# TSPM Configuration Reference

Complete reference for all configuration options available in TSPM.

## Table of Contents

- [Configuration File Formats](#configuration-file-formats)
- [Process Configuration](#process-configuration)
- [Health Check Configuration](#health-check-configuration)
- [Deployment Configuration](#deployment-configuration)
- [Complete Example](#complete-example)

---

## Configuration File Formats

TSPM supports three configuration file formats:

| Format | Extension | Parser |
|--------|-----------|--------|
| YAML | `.yaml`, `.yml` | yaml (js-yaml) |
| JSON | `.json` | json |
| JSON with Comments | `.jsonc` | jsonc |

### File Detection

TSPM automatically detects configuration files in this order:
1. `tspm.yaml` in current directory
2. `tspm.yml` in current directory
3. `tspm.json` in current directory

Use `-c` or `--config` to specify a custom file:
```bash
tspm start -c custom-config.yaml
```

---

## Process Configuration

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Process name (unique identifier) |
| `script` | string | Script or binary to run |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `args` | string[] | `[]` | Arguments to pass to the script |
| `cwd` | string | current dir | Working directory |
| `instances` | number | 1 | Number of cluster instances |
| `execMode` | string | "fork" | Execution mode: "fork" or "cluster" |
| `interpreter` | string | "none" | Interpreter: "none", "node", "bun" |

### Restart Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autorestart` | boolean | true | Enable auto-restart on crash |
| `maxRestarts` | number | 16 | Maximum restarts before stopping |
| `restartDelay` | number | 0 | Delay between restarts (ms) |
| `minUptime` | number | 500 | Min uptime before counting as started (ms) |
| `minRestartDelay` | number | 1000 | Min delay before restart (ms) |
| `maxRestartDelay` | number | 60000 | Max delay between restarts (ms) |
| `restartBackoff` | number | 10 | Exponential backoff multiplier |

### Resource Limits

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxMemory` | string | - | Memory limit (e.g., "500M", "2G") |
| `maxCpu` | number | - | CPU limit percentage |

### Load Balancing

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lbStrategy` | string | "round-robin" | Load balancing strategy |
| `instanceWeight` | number | 1 | Weight for weighted LB |

### Process Groups

| Option | Type | Description |
|--------|------|-------------|
| `namespace` | string | Process namespace |
| `clusterGroup` | string | Cluster group name |

### Environment

| Option | Type | Description |
|--------|------|-------------|
| `env` | object | Environment variables |
| `envFile` | string | Path to .env file |

### Lifecycle Hooks

| Option | Type | Description |
|--------|------|-------------|
| `preStart` | string \| string[] | Commands to run before process starts |
| `postStart` | string \| string[] | Commands to run after process starts |
| `preStop` | string \| string[] | Commands to run before process stops |
| `postStop` | string \| string[] | Commands to run after process stops |

### Watch & Reload

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `watch` | boolean | false | Enable file watching |
| `watchDelay` | number | 1000 | Debounce delay for watch (ms) |
| `ignoreWatch` | string[] | [] | Patterns to ignore |
| `watchOptions` | object | {} | chokidar options |

### Logging

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `log` | string | - | Log file path |
| `logDateFormat` | string | "YYYY-MM-DD HH:mm:ss Z" | Log date format |
| `logType` | string | "json" | Log format: "json" or "raw" |
| `mergeLogs` | boolean | false | Merge logs from all instances |
| `outFile` | string | - | stdout log file |
| `errFile` | string | - | stderr log file |
| `pidFile` | string | - | PID file path |

### Health Check

| Option | Type | Description |
|--------|------|-------------|
| `healthCheck` | object | Health check configuration |

### Container Orchestration

| Option | Type | Description |
|--------|------|-------------|
| `k8s` | object | Kubernetes labels/annotations |
| `docker` | object | Docker container config |

### Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `killTimeout` | number | 1600 | Time before force kill (ms) |
| `listenTimeout` | number | - | Timeout for listen event (ms) |
| `waitReady` | boolean | false | Wait for ready signal |
| `instanceVar` | string | "NODE_APP_INSTANCE" | Instance variable name |
| `nice` | number | - | Process priority (-20 to 19) |

---

## Health Check Configuration

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable health checks |
| `protocol` | string | "http" | http, https, tcp, or command |
| `host` | string | "localhost" | Host to check |
| `port` | number | process port | Port to check |
| `path` | string | "/" | HTTP path (for http/https) |
| `method` | string | "GET" | HTTP method |
| `interval` | number | 30000 | Check interval (ms) |
| `timeout` | number | 5000 | Check timeout (ms) |
| `retries` | number | 3 | Retries before unhealthy |
| `initialDelay` | number | 0 | Initial delay before first check (ms) |

### Examples

#### HTTP Health Check
```yaml
healthCheck:
  enabled: true
  protocol: http
  host: localhost
  port: 3000
  path: /health
  method: GET
  interval: 30000
  timeout: 5000
  retries: 3
```

#### TCP Health Check
```yaml
healthCheck:
  enabled: true
  protocol: tcp
  host: localhost
  port: 5432
  interval: 30000
  timeout: 5000
```

#### Command Health Check
```yaml
healthCheck:
  enabled: true
  protocol: command
  command: node healthcheck.js
  interval: 30000
  timeout: 5000
```

---

## Deployment Configuration

### Options

| Option | Type | Description |
|--------|------|-------------|
| `repo` | string | Git repository URL |
| `environments` | object | Environment configurations |

### Environment Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `host` | string | - | Remote server host |
| `user` | string | - | SSH user |
| `port` | number | 22 | SSH port |
| `key` | string | - | SSH key path |
| `path` | string | - | Remote deployment path |
| `ref` | string | "main" | Git branch/tag/commit |
| `preDeploy` | string[] | - | Pre-deploy hooks |
| `postDeploy` | string[] | - | Post-deploy hooks |
| `env` | object | - | Environment variables |

### Example

```yaml
deploy:
  repo: https://github.com/user/app.git
  environments:
    production:
      host: prod.example.com
      user: deploy
      port: 22
      key: ~/.ssh/deploy_key
      path: /var/www/production
      ref: main

      preDeploy:
        - npm ci
        - npm run build

      postDeploy:
        - tspm restart --all

      env:
        NODE_ENV: production
```

---

## Complete Example

```yaml
processes:
  - name: api-server
    script: bun
    args: [run, src/index.ts]
    instances: 4
    cwd: ./apps/api
    execMode: cluster
    lbStrategy: round-robin
    instanceWeight: 1
    namespace: production
    clusterGroup: api

    # Environment
    env:
      NODE_ENV: production
      PORT: "3000"
    envFile: .env.production

    # Restart policy
    autorestart: true
    maxRestarts: 10
    minUptime: 1000
    restartDelay: 1000
    minRestartDelay: 1000
    maxRestartDelay: 30000
    restartBackoff: 2

    # Resource limits
    maxMemory: 500M

    # Health check
    healthCheck:
      enabled: true
      protocol: http
      host: localhost
      port: 3000
      path: /health
      interval: 30000
      timeout: 5000
      retries: 3

    # Lifecycle hooks
    preStart: ./scripts/pre-start.sh
    postStart:
      - echo "Server started"
      - curl -X POST https://hooks.example.com/started

    # Watch & reload
    watch: true
    watchDelay: 1000
    ignoreWatch:
      - "**/node_modules/**"
      - "**/dist/**"

    # Logging
    log: logs/api-server.log
    logType: json
    mergeLogs: false
    outFile: logs/stdout.log
    errFile: logs/stderr.log
    logDateFormat: "YYYY-MM-DD HH:mm:ss"

    # Process priority
    nice: 10

    # Advanced
    killTimeout: 1600
    waitReady: false
    instanceVar: "APP_INSTANCE"

# Deployment configuration
deploy:
  repo: https://github.com/user/api-server.git
  environments:
    production:
      host: prod.example.com
      user: deploy
      path: /var/www/api
      ref: v1.0.0

      preDeploy:
        - npm ci
        - npm run build

      postDeploy:
        - tspm restart --all

      env:
        NODE_ENV: production

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
```

---

## Related Documentation

- [CLI Commands](CLI.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Startup Guide](STARTUP_GUIDE.md)

---

_Last Updated: 2026-02-13_
