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

## Phase 5: Developer Experience

- [ ] Add hot reload support (file watcher)
- [ ] Implement interactive terminal (like PM2 monit)
- [ ] Add JSON API for programmatic access
- [ ] Create PM2 migration guide/compatibility layer

### Phase 5 Goals

- [ ] `tspm dev` command for development mode
- [ ] Interactive TUI for process management
- [ ] REST API for remote management

---

## Phase 6: Production Features

- [ ] Add memory limit and auto-restart thresholds
- [ ] Implement exponential backoff configuration
- [ ] Add process priority (nice values)
- [ ] Support for container orchestration hints

### Phase 6 Goals

- [ ] Memory limit with OOM restart
- [ ] Process nice values for CPU scheduling
- [ ] Kubernetes/Docker metadata annotations

---

## Recommended Next Steps

Start with **Phase 3** - Enhance monitoring and observability:

1. Enhance the `monit` command with auto-refresh
2. Add log rotation based on file size
3. Implement structured JSON logging
4. Add webhook support for event notifications

---

## Implementation Priority

| Priority | Feature                | Phase   |
| -------- | ---------------------- | ------- |
| High     | Enhanced monitoring    | Phase 3 |
| High     | Log rotation           | Phase 3 |
| Medium   | Source map support     | Phase 4 |
| Medium   | Environment management | Phase 4 |
| Low      | Hot reload             | Phase 5 |
| Low      | Interactive TUI        | Phase 5 |

---

_Last Updated: 2026-02-02_
_Phase 2 Complete: Clustering, Load Balancing, Health Checks, Events_
