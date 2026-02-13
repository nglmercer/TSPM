# TSPM Progress Report

## Project Overview

TSPM (TypeScript Process Manager) is a PM2 alternative written in TypeScript for Bun/Node.js.

---

## Current Status: Phase 6 Complete ✅ - Phase 7 Planned

### Implemented Features

| Feature                  | Status | Description                                                 |
| ------------------------ | ------ | ----------------------------------------------------------- |
| Process spawning         | ✅     | Spawn child processes using Bun/Node                        |
| Lifecycle management     | ✅     | Start, stop, restart processes                              |
| Auto-restart             | ✅     | Exponential backoff on crash                                |
| Config loading           | ✅     | YAML, JSON, JSONC support                                   |
| File logging             | ✅     | stdout/stderr to log files                                  |
| Graceful shutdown        | ✅     | SIGINT/SIGTERM handling                                     |
| **Process clustering**   | ✅     | Multiple instances per process                              |
| **Load balancing**       | ✅     | 7 strategies (round-robin, random, least-connections, etc.) |
| **Process groups**       | ✅     | Namespaces and cluster groups                               |
| **Instance ID tracking** | ✅     | Auto-assigned instance IDs                                  |
| **Event system**         | ✅     | Event-driven architecture with webhooks                     |
| **Health checks**        | ✅     | HTTP, TCP, command-based probes                             |
| **Real-time Monit**      | ✅     | Auto-refreshing dashboard with stats                        |
| **Structured Logs**      | ✅     | JSON logging and auto-rotation                              |
| **Webhooks**             | ✅     | HTTP notifications for all events                           |
| **Dotenv Support**       | ✅     | Load environment from .env files                            |
| **Lifecycle Hooks**      | ✅     | preStart and postStart script execution                     |
| **Source Maps**          | ✅     | Transparent source map support for stack traces             |

### Missing PM2 Features (Phase 7)

| Feature               | Status | Description                      | Priority |
| --------------------- | ------ | -------------------------------- | -------- |
| **Startup scripts**   | ⏳     | Generate systemd/launchd scripts | High     |
| **Save/Resurrect**    | ⏳     | Persist and restore process list | High     |
| **Log flush**         | ⏳     | Clear all log files              | High     |
| **Reset command**     | ⏳     | Reset restart counters           | Medium   |
| **Deployment**        | ⏳     | Remote deployment via SSH        | Medium   |
| **Static serve**      | ⏳     | Serve static files               | Medium   |
| **Prettylist**        | ⏳     | Pretty-printed process list      | Medium   |
| **Report**            | ⏳     | Diagnostic report generation     | Medium   |
| **Module system**     | ⏳     | Extensibility via modules        | Low      |
| **Remote monitoring** | ⏳     | Cloud monitoring dashboard       | Low      |
| **Custom metrics**    | ⏳     | Application metrics API          | Low      |

---

## Phase 1: Core CLI Commands ✅ (COMPLETED)

### CLI Commands Implemented

| Command            | Status | Description                    |
| ------------------ | ------ | ------------------------------ |
| `start <file>`     | ✅     | Start processes from config    |
| `stop [--all]`     | ✅     | Stop running processes         |
| `restart [--all]`  | ✅     | Restart processes              |
| `reload`           | ✅     | Reload without downtime        |
| `delete [--all]`   | ✅     | Remove from process list       |
| `list`             | ✅     | List all processes (PM2-style) |
| `logs [--lines N]` | ✅     | Show process logs              |
| `monit`            | ✅     | Real-time monitoring           |
| `describe --name`  | ✅     | Process details                |
| `help`             | ✅     | Show help                      |

### Supporting Features

- **Daemon mode**: Run in background with `--daemon` flag
- **PID file management**: `.tspm/` directory
- **Status persistence**: `status.json` for process state
- **Config file detection**: Auto-discovery of tspm.yaml/json/jsonc

---

## Phase 2: Process Management Enhancements ✅ (COMPLETED)

### New CLI Commands

| Command                | Status | Description                        |
| ---------------------- | ------ | ---------------------------------- |
| `cluster [name]`       | ✅     | Show cluster information           |
| `scale <name> <count>` | ✅     | Scale cluster instances            |
| `groups`               | ✅     | Show process groups and namespaces |

### Load Balancing Strategies

| Strategy          | Status | Description                           |
| ----------------- | ------ | ------------------------------------- |
| round-robin       | ✅     | Distributes requests equally          |
| random            | ✅     | Random instance selection             |
| least-connections | ✅     | Fewest active connections             |
| least-cpu         | ✅     | Lowest CPU usage                      |
| least-memory      | ✅     | Lowest memory usage                   |
| ip-hash           | ✅     | Consistent client-to-instance mapping |
| weighted          | ✅     | Weight-based distribution             |

### Health Check Protocols

| Protocol | Status | Description             |
| -------- | ------ | ----------------------- |
| HTTP     | ✅     | GET/POST/PUT requests   |
| HTTPS    | ✅     | Secure HTTP requests    |
| TCP      | ✅     | TCP port connectivity   |
| command  | ✅     | Shell command execution |
| none     | ✅     | No health check         |

---

## Phase 3: Monitoring & Observability ✅ (COMPLETED)

- [x] Real-time process monitoring (CPU, Memory usage)
- [x] Structured logging with log rotation
- [x] Event system with Webhook support
- [x] Health checks and readiness/liveness probes

---

## Phase 4: Advanced Features ✅ (COMPLETED)

- [x] Source map support for stack traces
- [x] Environment variable management (.env support)
- [x] Pre/post start scripts and actions

---

## Phase 5: Developer Experience ✅ (COMPLETED)

- [x] Hot reload (file watcher)
- [x] JSON API for remote management
- [x] `tspm dev` command
- [x] Resource management (max-memory limits)
- [x] Dotenv support
- [x] Lifecycle hooks (preStart/postStart)

---

## Phase 6: Production Features ✅ (COMPLETED)

| Feature                | Status | Description                                                                   |
| ---------------------- | ------ | ----------------------------------------------------------------------------- |
| **Memory Limits**      | ✅     | maxMemory config for OOM restart                                              |
| **minUptime**          | ✅     | Minimum uptime before counting as successful start                            |
| **Restart Backoff**    | ✅     | Configurable restart delay (minRestartDelay, maxRestartDelay, restartBackoff) |
| **Process Priority**   | ✅     | nice value support for CPU scheduling                                         |
| **Kubernetes Support** | ✅     | Kubernetes config (labels, annotations, probes)                               |
| **Docker Support**     | ✅     | Docker config (container name, labels, limits)                                |
| **OOM Events**         | ✅     | process:oom event for memory limit detection                                  |

---

## Phase 7: PM2 Parity Features ⏳ (PLANNED)

### 7.1: Startup & Persistence

| Command     | Status | Description                        |
| ----------- | ------ | ---------------------------------- |
| `startup`   | ⏳     | Generate system startup scripts    |
| `save`      | ⏳     | Persist current process list       |
| `resurrect` | ⏳     | Restore processes from saved state |
| `unstartup` | ⏳     | Remove startup scripts             |

### 7.2: Log Management

| Command      | Status | Description         |
| ------------ | ------ | ------------------- |
| `flush`      | ⏳     | Clear all log files |
| `reloadLogs` | ⏳     | Reopen log files    |

### 7.3: Process Utilities

| Command      | Status | Description                  |
| ------------ | ------ | ---------------------------- |
| `reset`      | ⏳     | Reset restart counters       |
| `prettylist` | ⏳     | Pretty-printed process list  |
| `serve`      | ⏳     | Static file server           |
| `report`     | ⏳     | Diagnostic report generation |

### 7.4: Deployment System

| Feature           | Status | Description                 |
| ----------------- | ------ | --------------------------- |
| `deploy` command  | ⏳     | Remote deployment via SSH   |
| Pre-deploy hooks  | ⏳     | Scripts before deployment   |
| Post-deploy hooks | ⏳     | Scripts after deployment    |
| Multi-environment | ⏳     | Staging, production support |

### 7.5: Additional Config Options

| Option           | Status | Description                    |
| ---------------- | ------ | ------------------------------ |
| `kill_timeout`   | ⏳     | Time before force kill (ms)    |
| `listen_timeout` | ⏳     | Timeout for listen event (ms)  |
| `wait_ready`     | ⏳     | Wait for ready signal from app |
| `max_restarts`   | ⏳     | Max restarts before stopped    |
| `autorestart`    | ⏳     | Enable/disable auto restart    |
| `watch_delay`    | ⏳     | Debounce for watch (ms)        |
| `instance_var`   | ⏳     | Instance variable name         |
| `merge_logs`     | ⏳     | Merge logs from all instances  |

### 7.6: Module System (Low Priority)

| Feature              | Status | Description         |
| -------------------- | ------ | ------------------- |
| `install <module>`   | ⏳     | Install TSPM module |
| `uninstall <module>` | ⏳     | Remove TSPM module  |
| Module API           | ⏳     | Extension API       |

### 7.7: Remote Monitoring (Low Priority)

| Feature          | Status | Description             |
| ---------------- | ------ | ----------------------- |
| `link` command   | ⏳     | Connect to TSPM Cloud   |
| Remote dashboard | ⏳     | Web-based monitoring    |
| Custom metrics   | ⏳     | Application metrics API |
| Historical data  | ⏳     | Metrics storage         |

---

## Test Coverage

### Test Files (47 tests passing)

```
tests/
├── core/
│   ├── ConfigLoader.test.ts     # Config loading tests
│   ├── ManagedProcess.test.ts   # Process lifecycle tests
│   ├── ManagedProcessExtra.test.ts # Extra process tests
│   ├── ManagedProcessHooks.test.ts # Hook tests
│   ├── ProcessManager.test.ts   # Manager tests
│   ├── ProcessRegistry.test.ts  # Registry tests
│   └── ClusterManager.test.ts   # Cluster tests
├── cli/
│   └── index.test.ts           # CLI file operations
└── utils/
    ├── events.test.ts          # Event system tests
    ├── healthcheck.test.ts     # Health check tests
    ├── loadbalancer.test.ts    # Load balancer tests
    ├── logger.test.ts          # Logger tests
    ├── monitoring.test.ts      # Monitoring tests
    ├── stats.test.ts           # Stats tests
    └── config/
        ├── index.test.ts       # Config utilities
        ├── json.test.ts        # JSON parsing
        ├── yaml.test.ts        # YAML parsing
        ├── schema.test.ts      # Schema validation
        └── manager.test.ts     # Config manager
```

### Test Results

```
✓ 47 tests pass
✓ Multiple expect() calls
✓ 17 test files
```

---

## Project Structure

```
TSPM/
├── src/
│   ├── cli/
│   │   ├── index.ts           # CLI entry point
│   │   ├── program.ts         # CLI program setup
│   │   ├── commands/          # CLI commands
│   │   │   ├── cluster.ts     # Cluster command
│   │   │   ├── describe.ts    # Describe command
│   │   │   ├── dev.ts         # Dev command
│   │   │   ├── groups.ts      # Groups command
│   │   │   ├── list.ts        # List command
│   │   │   ├── logs.ts        # Logs command
│   │   │   ├── monit.ts       # Monit command
│   │   │   ├── scale.ts       # Scale command
│   │   │   ├── start.ts       # Start command
│   │   │   └── stop.ts        # Stop command
│   │   ├── state/             # State management
│   │   └── ui/                # UI components
│   ├── core/
│   │   ├── ClusterManager.ts  # Cluster management
│   │   ├── ConfigLoader.ts    # Config loading
│   │   ├── ManagedProcess.ts  # Process management
│   │   ├── ProcessManager.ts  # Multi-process manager
│   │   ├── ProcessEnvManager.ts # Environment management
│   │   ├── ProcessLogStreamer.ts # Log streaming
│   │   ├── ProcessRegistry.ts # Process registry
│   │   ├── ProcessWatcher.ts  # File watching
│   │   ├── constants.ts       # Core constants
│   │   ├── index.ts           # Core exports
│   │   └── types.ts           # Type definitions
│   └── utils/
│       ├── api.ts             # REST API
│       ├── constants.ts       # Utility constants
│       ├── logger.ts          # Logging utilities
│       ├── monitoring.ts      # Process monitoring
│       ├── stats.ts           # Process statistics
│       ├── webhooks.ts        # Webhook support
│       ├── config/            # Config utilities
│       ├── events/            # Event system
│       ├── healthcheck/       # Health checks
│       └── loadbalancer/      # Load balancing
├── tests/                     # Test suite
├── examples/                  # Example scripts
│   ├── applications/          # Example apps
│   └── config/                # Example configs
├── docs/                      # Documentation
├── tspm.yaml                  # Example config
└── package.json               # Project config
```

---

## Usage Examples

```bash
# Start processes
bun run src/cli/index.ts start tspm.yaml

# List processes
bun run src/cli/index.ts list

# View logs
bun run src/cli/index.ts logs

# Stop all
bun run src/cli/index.ts stop --all

# Show clusters
bun run src/cli/index.ts cluster

# Show process groups
bun run src/cli/index.ts groups

# Development mode with hot reload
bun run src/cli/index.ts dev tspm.yaml
```

### Configuration Example (Phase 2)

```yaml
processes:
  - name: api-server
    script: ./server.js
    instances: 4
    lbStrategy: round-robin
    healthCheck:
      enabled: true
      protocol: http
      path: /health
      interval: 30000
      retries: 3
    clusterGroup: api

  - name: worker
    script: ./worker.js
    instances: 2
    namespace: background-jobs
```

---

## PM2 Feature Parity Status

### Completed ✅

- Process lifecycle management (start, stop, restart, reload, delete)
- Process clustering with multiple instances
- Load balancing (7 strategies)
- Health checks (HTTP, TCP, command)
- Real-time monitoring (monit command)
- Log management with rotation
- Hot reload / file watching
- Environment variables (.env support)
- Source map support
- Webhook notifications
- Lifecycle hooks (preStart, postStart)
- Memory limits and OOM detection
- Process priority (nice values)
- Container orchestration hints

### In Progress / Planned ⏳

- Startup scripts generation (systemd, launchd)
- Process persistence (save/resurrect)
- Log flush command
- Reset restart counters
- Deployment system
- Static file server
- Module system
- Remote monitoring

---

## Next Steps

1. Implement `startup` command for systemd/launchd generation
2. Implement `save` and `resurrect` commands
3. Add `flush` command for log management
4. Add `reset` command for restart counters
5. Consider deployment system implementation

---

_Last Updated: 2026-02-13_
_Total Tests: 47 passing_
_Phase 6 Complete: Memory Limits, Priority, Container Support_
_Next: Phase 7 - PM2 Parity Features (Startup, Save, Flush, Reset)_
