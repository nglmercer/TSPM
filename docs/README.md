# TSPM Documentation

> Comprehensive documentation for TSPM (TypeScript Process Manager)

## 📚 Documentation Index

### Getting Started

| Document | Description |
|----------|-------------|
| [Main README](../README.md) | Project overview, features, and quick start |
| [Configuration Reference](CONFIG.md) | Complete configuration options |
| [CLI Reference](CLI.md) | Detailed CLI command documentation |

### Core Features

| Document | Description |
|----------|-------------|
| [Deployment Guide](DEPLOYMENT.md) | Remote deployment via SSH with hooks |
| [Startup Guide](STARTUP_GUIDE.md) | System startup scripts and persistence |

### Project Information

| Document | Description |
|----------|-------------|
| [Progress Report](PROGRESS.md) | Implementation status and completed features |
| [Roadmap](ROADMAP.md) | Future development plans |

---

## 🚀 Quick Navigation

### For New Users

1. Start with the [Main README](../README.md) to understand what TSPM is
2. Follow the Quick Start section to run your first process
3. Read [Configuration Reference](CONFIG.md) to customize your setup

### For Production Use

1. Read [Deployment Guide](DEPLOYMENT.md) for remote deployment
2. Read [Startup Guide](STARTUP_GUIDE.md) for boot persistence
3. Review [CLI Reference](CLI.md) for all available commands

### For Development

1. Check [Configuration Reference](CONFIG.md) for dev options
2. Review health check and lifecycle hook configuration
3. Use `tspm dev` command for hot reload

---

## 📖 Feature Guides

### Process Management

- **Clustering**: Run multiple instances with `instances` config option
- **Load Balancing**: 7 strategies (round-robin, random, least-connections, etc.)
- **Health Checks**: HTTP, TCP, and command-based probes
- **Lifecycle Hooks**: preStart, postStart, preStop, postStop

### Deployment

- **SSH Deployment**: Deploy to remote servers via SSH
- **Pre/Post Hooks**: Run scripts before and after deployment
- **Multi-Environment**: Support for staging, production, etc.

### Operations

- **Startup Scripts**: Generate systemd scripts for boot
- **Save/Resurrect**: Persist and restore process lists
- **Log Management**: File logging with rotation

---

## 🔧 Configuration Examples

### Basic Process

```yaml
processes:
  - name: my-app
    script: bun
    args: [run, src/index.ts]
```

### Clustered API

```yaml
processes:
  - name: api
    script: bun
    args: [run, src/server.ts]
    instances: 4
    lbStrategy: round-robin
    healthCheck:
      enabled: true
      protocol: http
      path: /health
```

### Full Deployment

```yaml
deploy:
  repo: https://github.com/user/app.git
  environments:
    production:
      host: prod.example.com
      user: deploy
      path: /var/www/app
      preDeploy:
        - npm ci
        - npm run build
      postDeploy:
        - tspm restart --all
```

---

## 📁 File Structure

```
docs/
├── README.md           # This file - documentation index
├── CONFIG.md           # Configuration reference
├── CLI.md              # CLI command reference
├── DEPLOYMENT.md       # Deployment guide
├── STARTUP_GUIDE.md    # Startup/persistence guide
├── PROGRESS.md         # Implementation progress
└── ROADMAP.md          # Development roadmap
```

---

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Process won't start | Check config file syntax and script path |
| Health check failing | Verify the endpoint and network connectivity |
| Deployment fails | Check SSH credentials and remote server access |
| Startup script not working | Verify systemd installation and permissions |

### Getting Help

1. Run `tspm report` for diagnostic information
2. Check [Progress Report](PROGRESS.md) for feature status
3. Review [CLI Reference](CLI.md) for correct command usage

---

## Related Links

- [GitHub Repository](https://github.com/nglmercer/tspm)
- [Main README](../README.md)
- [Examples Directory](../examples/)

---

_Last Updated: 2026-02-13_
