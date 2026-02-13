# TSPM Documentation

Welcome to the TSPM (TypeScript Process Manager) documentation. This directory contains detailed guides and references for using TSPM.

## Documentation Index

| Document                              | Description                                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [**Deployment Guide**](DEPLOYMENT.md) | Learn how to deploy your applications to remote servers via SSH with pre/post hooks and multi-environment support. |
| [**Startup Guide**](STARTUP_GUIDE.md) | Configure TSPM to start on system boot with systemd/launchd scripts and persist process lists.                     |
| [**Progress Report**](PROGRESS.md)    | Track the implementation status of features and see what's been completed in each phase.                           |
| [**Roadmap**](ROADMAP.md)             | View the development roadmap and planned features for future releases.                                             |

## Quick Links

### Getting Started

1. **Installation** - See the main [README.md](../README.md) for installation instructions
2. **Configuration** - Learn how to configure your processes in the main README
3. **Basic Commands** - Reference the CLI command table in the main README

### Production Deployment

1. **Remote Deployment** - Follow the [Deployment Guide](DEPLOYMENT.md) to deploy via SSH
2. **System Startup** - Use the [Startup Guide](STARTUP_GUIDE.md) to configure boot persistence
3. **Process Persistence** - Learn about `save` and `resurrect` commands

### Feature Reference

#### Process Management

- Start, stop, restart, reload processes
- Process clustering with multiple instances
- Auto-restart with exponential backoff
- Resource limits (memory, restarts)

#### Load Balancing

- 7 strategies: round-robin, random, least-connections, least-cpu, least-memory, ip-hash, weighted
- Configurable per process

#### Health Checks

- HTTP/HTTPS probes
- TCP connectivity checks
- Command-based checks
- Configurable intervals and retries

#### Monitoring

- Real-time dashboard (`tspm monit`)
- Log management with rotation
- Webhook notifications
- Diagnostic reports

#### Deployment

- Git-based deployment
- Rsync-based local deployment
- Pre/post deploy hooks
- Multi-environment support

## Configuration Reference

### Process Options

| Option        | Type            | Description                 |
| ------------- | --------------- | --------------------------- |
| `name`        | string          | Process name (required)     |
| `script`      | string          | Script to run (required)    |
| `args`        | string[]        | Arguments to pass to script |
| `cwd`         | string          | Working directory           |
| `instances`   | number          | Number of cluster instances |
| `lbStrategy`  | string          | Load balancing strategy     |
| `env`         | object          | Environment variables       |
| `envFile`     | string          | Path to .env file           |
| `maxMemory`   | string          | Memory limit (e.g., "500M") |
| `maxRestarts` | number          | Maximum restart attempts    |
| `autorestart` | boolean         | Enable auto-restart         |
| `watch`       | boolean         | Enable file watching        |
| `healthCheck` | object          | Health check configuration  |
| `preStart`    | string/string[] | Pre-start hooks             |
| `postStart`   | string/string[] | Post-start hooks            |

### Health Check Options

| Option     | Type    | Description                  |
| ---------- | ------- | ---------------------------- |
| `enabled`  | boolean | Enable health checks         |
| `protocol` | string  | http, https, tcp, or command |
| `host`     | string  | Host to check                |
| `port`     | number  | Port to check                |
| `path`     | string  | HTTP path (for http/https)   |
| `interval` | number  | Check interval (ms)          |
| `timeout`  | number  | Check timeout (ms)           |
| `retries`  | number  | Retries before unhealthy     |

### Deployment Options

| Option         | Type            | Description                |
| -------------- | --------------- | -------------------------- |
| `repo`         | string          | Git repository URL         |
| `environments` | object          | Environment configurations |
| `host`         | string          | Remote host                |
| `user`         | string          | SSH user                   |
| `port`         | number          | SSH port (default: 22)     |
| `key`          | string          | SSH key path               |
| `path`         | string          | Remote deployment path     |
| `ref`          | string          | Git branch/tag/commit      |
| `preDeploy`    | string/string[] | Pre-deploy hooks           |
| `postDeploy`   | string/string[] | Post-deploy hooks          |

## Support

- **Issues**: Report bugs on the GitHub issue tracker
- **Contributions**: Pull requests are welcome
- **Documentation**: Help improve these docs

---

_Return to [Main README](../README.md)_
