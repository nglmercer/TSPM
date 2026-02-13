# TSPM Roadmap - PM2 Alternative

## Current State (Already Implemented ✅)

- Process spawning and lifecycle management
- Auto-restart with exponential backoff
- YAML/JSON/JSONC configuration support
- Basic stdout/stderr file logging
- Graceful shutdown handling (SIGINT/SIGTERM)

---

## Phase 1: Core CLI Commands (Immediate Priority) ✅

- [x] Implement CLI parser with commands: `start`, `stop`, `restart`, `reload`, `delete`, `list`, `logs`, `monit`, `describe`
- [x] Add daemon mode (run in background, persist state)
- [x] Add PID file management
- [x] Add process status file (ecosystem.json-like)

## Phase 2: Process Management Enhancements ✅

- [x] Add process clustering (multiple instances)
- [x] Add load balancing strategies (round-robin, random, least-connections, least-cpu, least-memory, ip-hash, weighted)
- [x] Implement process groups and namespaces
- [x] Add instance ID tracking
- [x] Add event system for process state changes
- [x] Add health checks (HTTP, HTTPS, TCP, command-based)

### New CLI Commands in Phase 2

- `cluster [name]` - Show cluster information
- `scale <name> <count>` - Scale cluster instances
- `groups` - Show process groups and namespaces

### New Configuration Options

```yaml
processes:
  - name: my-app
    script: ./app.js
    instances: 4 # Number of cluster instances
    lbStrategy: round-robin # Load balancing strategy
    instanceWeight: 1 # Weight for weighted load balancing
    namespace: production # Process namespace
    clusterGroup: api # Cluster group name
    healthCheck:
      enabled: true
      protocol: http
      host: localhost
      port: 3000
      path: /health
      interval: 30000
      retries: 3
```

---

## Phase 3: Monitoring & Observability ✅ (COMPLETED)

- [x] Add real-time process monitoring (CPU, Memory usage)
- [x] Add structured logging with log rotation
- [x] Implement event system with Webhook support
- [x] Add health checks and readiness/liveness probes

### Phase 3 Goals

- [x] Real-time metrics dashboard in `monit` command
- [x] Log rotation with size limits
- [x] Structured JSON logging option
- [x] Event webhook notifications

---

## Phase 4: Advanced Features ✅ (COMPLETED)

- [x] Add source map support for stack traces
- [x] Implement environment variable management (.env support)
- [x] Support for pre/post start scripts and actions

### Phase 4 Goals

- [x] `preStart` and `postStart` script hooks
- [x] Environment file support (.env)
- [x] Source map support for error tracing

---

## Phase 5: Developer Experience ✅ (COMPLETED)

- [x] Add hot reload support (file watcher)
- [x] Implement JSON API for programmatic access (REST-ish)
- [x] Add `tspm dev` command for seamless development
- [x] Support for resource management (maxMemory)
- [x] Implementation of pre/post start lifecycle hooks

### Phase 5 Goals

- [x] `tspm dev` command for development mode with hot-reload
- [x] REST API for remote management
- [x] File watcher with debouncing and ignore patterns

---

## Phase 6: Production Features ✅ (COMPLETED)

- [x] Add memory limit and auto-restart thresholds
- [x] Implement exponential backoff configuration
- [x] Add process priority (nice values)
- [x] Support for container orchestration hints

### Phase 6 Goals

- [x] Memory limit with OOM restart
- [x] Process nice values for CPU scheduling
- [x] Kubernetes/Docker metadata annotations

---

## Phase 7: PM2 Parity Features (In Progress)

### 7.1: Startup & Persistence ✅ (COMPLETED)

- [x] `startup` command - Generate system startup scripts (systemd, launchd, openrc)
- [x] `save` command - Persist current process list
- [x] `resurrect` command - Restore processes from saved state
- [x] `unstartup` command - Remove startup scripts

### 7.2: Log Management (High Priority)

- [x] `flush` command - Clear all log files
- [x] `reloadLogs` command - Reopen log files (for log rotation external tools)
- [ ] Log streaming to external services (Loggly, Papertrail, etc.)

### 7.3: Process Utilities ✅ (COMPLETED)

- [x] `reset` command - Reset process restart counters
- [x] `prettylist` command - Pretty-printed JSON process list
- [x] `serve <path> <port>` command - Static file server
- [x] `report` command - Generate diagnostic report

### 7.4: Deployment System ✅ (COMPLETED)

- [x] `deploy` command - Remote deployment with SSH
- [x] Deployment configuration in ecosystem file
- [x] Pre-deploy/post-deploy hooks
- [x] Multi-environment support (staging, production)

### 7.5: Additional Configuration Options ✅ (COMPLETED)

- [x] `killTimeout` - Time before force kill (ms)
- [x] `listenTimeout` - Timeout for listen event (ms)
- [x] `waitReady` - Wait for ready signal from app
- [x] `maxRestarts` - Max restarts before stopped
- [x] `autorestart` - Enable/disable auto restart
- [x] `watchDelay` - Debounce for watch (ms)
- [x] `instanceVar` - Custom instance variable name
- [x] `mergeLogs` - Merge logs from all instances

```yaml
processes:
  - name: my-app
    script: ./app.js
    # Phase 7.5 Options:
    killTimeout: 1600 # Time before force kill (ms)
    listenTimeout: 3000 # Timeout for listen event (ms)
    waitReady: false # Wait for ready signal from app
    maxRestarts: 10 # Max restarts before stopped
    autorestart: true # Enable/disable auto restart
    watchDelay: 100 # Debounce for watch (ms)
    instanceVar: "NODE_APP_INSTANCE" # Instance variable name
    mergeLogs: false # Merge logs from all instances
```

---

## Implementation Priority

| Priority | Feature           | Phase   | Status |
| -------- | ----------------- | ------- | ------ |
| High     | Startup scripts   | Phase 7 | ✅     |
| High     | Save/Resurrect    | Phase 7 | ✅     |
| High     | Log flush         | Phase 7 | ✅     |
| Medium   | Reset command     | Phase 7 | ⏳     |
| Medium   | Deployment system | Phase 7 | ⏳     |
| Medium   | Static serve      | Phase 7 | ⏳     |

---

## PM2 Feature Comparison

| Feature            | PM2 | TSPM | Notes                       |
| ------------------ | --- | ---- | --------------------------- |
| Process management | ✅  | ✅   | Core feature                |
| Clustering         | ✅  | ✅   | Multiple instances          |
| Load balancing     | ✅  | ✅   | 7 strategies                |
| Health checks      | ✅  | ✅   | HTTP/TCP/Command            |
| Log management     | ✅  | ✅   | File logging + rotation     |
| Hot reload         | ✅  | ✅   | File watcher                |
| Environment vars   | ✅  | ✅   | .env support                |
| Source maps        | ✅  | ✅   | Stack trace support         |
| Webhooks           | ✅  | ✅   | Event notifications         |
| Startup scripts    | ✅  | ✅   | systemd/launchd generation  |
| Save/Resurrect     | ✅  | ✅   | Process persistence         |
| Log flush          | ✅  | ✅   | Clear logs command          |
| Log reload         | ✅  | ✅   | Reload logs command         |
| Static serve       | ✅  | ✅   | Serve static files          |
| Reset counters     | ✅  | ✅   | Reset restart count         |
| Prettylist         | ✅  | ✅   | Pretty-printed process list |
| Diagnostic report  | ✅  | ✅   | Generate diagnostic report  |
| Deployment         | ✅  | ✅   | Remote deploy via SSH       |

---

_Last Updated: 2026-02-13_
_Phase 7.3 Complete: Reset, Prettylist, Serve, Report_
_Next: Phase 7.4 - Deployment System_
