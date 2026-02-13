# TSPM Progress Report

## Project Overview

TSPM (TypeScript Process Manager) is a PM2 alternative written in TypeScript for Bun/Node.js.

---

## Current Status: Phase 4 Complete ✅

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

## Test Coverage

### Test Files (42 tests passing)

```
tests/
├── core/
│   ├── ConfigLoader.test.ts     # Config loading tests
│   ├── ManagedProcess.test.ts   # Process lifecycle tests
│   └── ProcessManager.test.ts   # Manager tests
├── cli/
│   └── index.test.ts           # CLI file operations
└── utils/config/
    ├── index.test.ts           # Config utilities
    ├── json.test.ts            # JSON parsing
    ├── yaml.test.ts            # YAML parsing
    ├── schema.test.ts          # Schema validation
    └── manager.test.ts         # Config manager
```

### Test Results

```
✓ 42 tests pass
✓ 84 expect() calls
✓ 9 test files
```

---

## Project Structure

```
TSPM/
├── src/
│   ├── cli/
│   │   └── index.ts           # CLI commands
│   ├── core/
│   │   ├── ConfigLoader.ts    # Config loading
│   │   ├── ManagedProcess.ts  # Process management
│   │   ├── ProcessManager.ts # Multi-process manager
│   │   └── types.ts           # Type definitions
│   └── utils/
│       ├── config/
│       │   ├── constants.ts        # Constants & defaults
│       │   ├── init.ts            # Initialization
│       │   ├── json.ts            # JSON utilities
│       │   ├── manager.ts         # Config manager
│       │   ├── schema.ts          # Validation schema
│       │   └── yaml.ts            # YAML utilities
│       ├── loadbalancer.ts       # Load balancing strategies
│       ├── events.ts             # Event system
│       ├── healthcheck.ts        # Health checks
│       ├── logger.ts            # Logging
│       └── stats.ts             # Process statistics
├── tests/                    # Test suite
├── examples/                # Example scripts
├── tspm.yaml               # Example config
└── package.json            # Project config
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

## Roadmap (Remaining Phases)

### Phase 3: Monitoring & Observability ✅ (COMPLETED)

- [x] Real-time CPU/Memory monitoring (enhanced dashboard)
- [x] Structured logging with rotation
- [x] Event system with Webhook support
- [x] Health checks and readiness/liveness probes

### Phase 4: Advanced Features ✅ (COMPLETED)

- [x] Source map support for stack traces
- [x] Environment variable management (.env)
- [x] Pre/post scripts and lifecycle hooks

### Phase 5: Developer Experience

- [ ] Hot reload (file watcher)
- [ ] Interactive terminal
- [ ] JSON API

### Phase 6: Production Features

- [ ] Memory limits
- [ ] Process priority (nice)
- [ ] Container orchestration hints

---

## Next Steps

1. Run `bun run src/cli/index.ts start tspm.yaml` to test
2. Try `bun run src/cli/index.ts list` to see running processes
3. Try `bun run src/cli/index.ts cluster` to see cluster information
4. Add more test cases as features are implemented

---

_Last Updated: 2026-02-02_
_Total Tests: 42 passing_
_Phase 2 Complete: Load Balancing, Clustering, Health Checks, Events_
