# TSPM - TypeScript Process Manager

<p align="center">
  <a href="https://github.com/nglmercer/tspm">
    <img src="https://img.shields.io/github/stars/nglmercer/tspm?style=flat&color=blue" alt="Stars">
  </a>
  <a href="https://github.com/nglmercer/tspm/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/nglmercer/tspm?color=yellow" alt="License">
  </a>
</p>

> A modern, feature-rich process manager for Node.js and Bun applications. TSPM is a PM2 alternative written entirely in TypeScript.

## Overview

TSPM (TypeScript Process Manager) provides robust process management with advanced features like clustering, load balancing, health checks, hot reload, and remote deployment. Built with TypeScript and Bun for maximum performance and developer experience.

## ✨ Features

### Core Features

| Feature                | Description                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Process Lifecycle**  | Start, stop, restart, reload, and delete processes                                               |
| **Process Clustering** | Run multiple instances of your application                                                       |
| **Load Balancing**     | 7 strategies: round-robin, random, least-connections, least-cpu, least-memory, ip-hash, weighted |
| **Auto-restart**       | Exponential backoff with configurable restart policies                                           |
| **Log Management**     | File logging with rotation and structured JSON output                                            |
| **Hot Reload**         | File watching with automatic process restart                                                     |

### Advanced Features

| Feature                   | Description                                      |
| ------------------------- | ------------------------------------------------ |
| **Health Checks**         | HTTP, HTTPS, TCP, and command-based probes       |
| **Webhooks**              | Event notifications for process lifecycle events |
| **Source Maps**           | Transparent stack trace support                  |
| **Environment Variables** | .env file support with per-process configuration |
| **Lifecycle Hooks**       | preStart and postStart script execution          |
| **Real-time Monitoring**  | Interactive dashboard with CPU and memory stats  |

### Production Features

| Feature               | Description                                           |
| --------------------- | ----------------------------------------------------- |
| **Startup Scripts**   | Generate systemd/launchd scripts for boot persistence |
| **Save/Resurrect**    | Persist and restore process lists                     |
| **Remote Deployment** | SSH-based deployment with pre/post hooks              |
| **Multi-environment** | Staging, production, and custom environments          |
| **Resource Limits**   | Memory limits with OOM detection                      |

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/nglmercer/tspm.git
cd tspm

# Install dependencies
bun install
```

### Start Your First Process

```bash
# Start from a config file
bun src/cli/index.ts start -c tspm.yaml

# Or use the example configuration
bun src/cli/index.ts start -c examples/config/app.basic.yaml
```

### Rust Crash & Respawn Test

Demonstrate process resilience and restart limits using a Rust application:

```bash
bun run example:rust
```

This example compiles a simple Rust HTTP server, starts it, crashes it repeatedly, and verifies that TSPM stops restarting it after `maxRestarts` is reached.

### Basic Commands

```bash
# List all processes
bun src/cli/index.ts list

# View process logs
bun src/cli/index.ts logs

# Monitor processes in real-time
bun src/cli/index.ts monit

# Stop all processes
bun src/cli/index.ts stop --all
```

## 📋 Configuration

Create a `tspm.yaml` or `tspm.json` file in your project:

```yaml
# tspm.yaml
processes:
  - name: my-api
    script: bun
    args: [run, src/index.ts]
    instances: 2
    cwd: ./apps/api

    # Load balancing strategy
    lbStrategy: round-robin

    # Health checks
    healthCheck:
      enabled: true
      protocol: http
      path: /health
      interval: 30000
      retries: 3

    # Environment variables
    env:
      NODE_ENV: production
      PORT: "3000"

    # Resource limits
    maxMemory: 500M
    maxRestarts: 10

    # Lifecycle hooks
    preStart: echo "Starting..."
    postStart: curl -X POST https://webhooks.example.com/started
```

## 📖 CLI Commands Reference

### Process Management

| Command          | Alias             | Description                       |
| ---------------- | ----------------- | --------------------------------- |
| `start <config>` | `start -c <file>` | Start processes from config file  |
| `stop [name]`    | `stop --all`      | Stop running processes            |
| `restart [name]` | `restart --all`   | Restart processes                 |
| `reload`         | -                 | Reload processes without downtime |
| `delete [name]`  | `delete --all`    | Remove processes from list        |
| `list`           | `ls`              | List all processes (PM2-style)    |

### Monitoring & Logs

| Command                   | Description                       |
| ------------------------- | --------------------------------- |
| `logs [name] [--lines N]` | View process logs                 |
| `monit`                   | Real-time monitoring dashboard    |
| `describe <name>`         | Show detailed process information |
| `prettylist`              | Pretty-printed JSON process list  |
| `report`                  | Generate diagnostic report        |

### Clustering & Scaling

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `cluster [name]`       | Show cluster information           |
| `scale <name> <count>` | Scale cluster instances            |
| `groups`               | Show process groups and namespaces |

### Development

| Command               | Description                      |
| --------------------- | -------------------------------- |
| `dev <config>`        | Development mode with hot reload |
| `serve <path> [port]` | Static file server               |

### Deployment & Operations

| Command              | Description                      |
| -------------------- | -------------------------------- |
| `deploy [env]`       | Deploy to remote server via SSH  |
| `save`               | Save current process list        |
| `resurrect`          | Restore saved processes          |
| `startup [platform]` | Generate systemd startup scripts |
| `unstartup`          | Remove startup scripts           |
| `flush`              | Clear all log files              |
| `reset [name]`       | Reset restart counters           |

## 📚 Documentation

| Document                                     | Description                            |
| -------------------------------------------- | -------------------------------------- |
| [📖 Main README](README.md)                  | This file - overview and quick start   |
| [🚀 Deployment Guide](docs/DEPLOYMENT.md)    | Remote deployment via SSH with hooks   |
| [🔧 Startup Guide](docs/STARTUP_GUIDE.md)    | System startup scripts and persistence |
| [📊 Progress Report](docs/PROGRESS.md)       | Implementation status and features     |
| [🗺️ Roadmap](docs/ROADMAP.md)                | Future development plans               |
| [⚙️ Configuration Reference](docs/CONFIG.md) | Complete configuration options         |
| [💻 CLI Reference](docs/CLI.md)              | Detailed CLI command reference         |

## 🏗️ Project Structure

```
TSPM/
├── src/
│   ├── cli/                    # CLI implementation
│   │   ├── index.ts           # Entry point
│   │   ├── program.ts         # Command setup
│   │   ├── commands/          # Individual commands
│   │   │   ├── start.ts       # Start command
│   │   │   ├── stop.ts        # Stop command
│   │   │   ├── list.ts        # List command
│   │   │   ├── logs.ts        # Logs command
│   │   │   ├── monit.ts       # Monit command
│   │   │   ├── deploy.ts      # Deploy command
│   │   │   └── ...            # More commands
│   │   ├── state/             # State management
│   │   └── ui/                # UI components
│   ├── core/                   # Core functionality
│   │   ├── ManagedProcess.ts  # Process management
│   │   ├── ProcessManager.ts  # Multi-process manager
│   │   ├── ClusterManager.ts  # Clustering logic
│   │   ├── ConfigLoader.ts    # Config parsing
│   │   └── types.ts           # Type definitions
│   └── utils/                  # Utilities
│       ├── monitoring.ts      # Process monitoring
│       ├── logger.ts          # Logging utilities
│       ├── webhooks.ts        # Webhook support
│       ├── healthcheck/       # Health check system
│       ├── loadbalancer/      # Load balancing
│       └── events/            # Event system
├── tests/                      # Test suite
├── examples/                   # Example configs and apps
│   ├── config/                # Configuration examples
│   └── applications/          # Example applications
├── docs/                       # Documentation
└── tspm.yaml                   # Example config
```

## 📊 PM2 Feature Comparison

| Feature            | PM2 | TSPM | Notes                  |
| ------------------ | --- | ---- | ---------------------- |
| Process management | ✅  | ✅   | Full lifecycle support |
| Clustering         | ✅  | ✅   | Multiple instances     |
| Load balancing     | ✅  | ✅   | 7 strategies           |
| Health checks      | ✅  | ✅   | HTTP/TCP/Command       |
| Log management     | ✅  | ✅   | File + rotation        |
| Hot reload         | ✅  | ✅   | File watcher           |
| Environment vars   | ✅  | ✅   | .env support           |
| Source maps        | ✅  | ✅   | Stack trace support    |
| Webhooks           | ✅  | ✅   | Event notifications    |
| Startup scripts    | ✅  | ✅   | systemd/launchd        |
| Save/Resurrect     | ✅  | ✅   | Process persistence    |
| Deployment         | ✅  | ✅   | SSH deploy             |
| Static serve       | ✅  | ✅   | File server            |
| Diagnostic report  | ✅  | ✅   | Full diagnostics       |

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/core/ManagedProcess.test.ts

# Run with coverage
bun test --coverage
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

---
