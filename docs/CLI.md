# TSPM CLI Reference

Complete reference for all CLI commands available in TSPM.

## Table of Contents

- [Usage](#usage)
- [Global Options](#global-options)
- [Process Management Commands](#process-management-commands)
- [Monitoring Commands](#monitoring-commands)
- [Clustering Commands](#clustering-commands)
- [Development Commands](#development-commands)
- [Deployment Commands](#deployment-commands)
- [Persistence Commands](#persistence-commands)
- [Utility Commands](#utility-commands)

---

## Usage

```bash
# Using bun
bun src/cli/index.ts <command> [options]

# After installation
tspm <command> [options]
```

---

## Global Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--config <file>` | `-c` | Configuration file path |
| `--help` | `-h` | Show help information |
| `--version` | `-v` | Show version information |

---

## Process Management Commands

### start

Start processes from a configuration file.

```bash
tspm start <config-file> [options]
tspm start -c tspm.yaml [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--config <file>` | `-c` | Configuration file path |
| `--daemon` | `-d` | Run in daemon mode (background) |
| `--name <name>` | `-n` | Process name (for single process config) |
| `--watch` | `-w` | Enable file watching |
| `--env <env>` | `-e` | Environment to use |

**Examples:**

```bash
# Start from config file
tspm start tspm.yaml

# Start in daemon mode
tspm start tspm.yaml --daemon

# Start with hot reload
tspm start tspm.yaml --watch
```

---

### stop

Stop running processes.

```bash
tspm stop [process-name] [options]
tspm stop --all
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--all` | `-a` | Stop all processes |
| `--name <name>` | `-n` | Process name to stop |

**Examples:**

```bash
# Stop specific process
tspm stop my-api

# Stop all processes
tspm stop --all
```

---

### restart

Restart processes.

```bash
tspm restart [process-name] [options]
tspm restart --all
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--all` | `-a` | Restart all processes |
| `--name <name>` | `-n` | Process name to restart |
| `--update-env` | `-u` | Update environment variables |

**Examples:**

```bash
# Restart specific process
tspm restart my-api

# Restart all processes
tspm restart --all
```

---

### reload

Reload processes without downtime (graceful restart).

```bash
tspm reload [process-name]
tspm reload --all
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--all` | `-a` | Reload all processes |

---

### delete

Remove processes from the process list.

```bash
tspm delete [process-name]
tspm delete --all
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--all` | `-a` | Delete all processes |

---

### list

List all running processes (PM2-style).

```bash
tspm list [options]
tspm ls [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--no-color` | - | Disable colored output |
| `--watch` | `-w` | Watch mode (auto-refresh) |

**Output Columns:**

| Column | Description |
|--------|-------------|
| `name` | Process name |
| `id` | Process ID |
| `status` | Running status |
| `restarts` | Restart count |
| `uptime` | Running time |
| `cpu` | CPU usage |
| `memory` | Memory usage |

---

## Monitoring Commands

### logs

View process logs.

```bash
tspm logs [process-name] [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--lines <number>` | `-n` | Number of lines to show (default: 100) |
| `--follow` | `-f` | Follow log output (tail -f) |
| `--timestamp` | `-t` | Show timestamps |
| `--err` | `-e` | Show only stderr |
| `--out` | `-o` | Show only stdout |

**Examples:**

```bash
# View last 100 lines
tspm logs my-api

# Follow logs in real-time
tspm logs my-api --follow

# Show last 50 lines with timestamps
tspm logs my-api --lines 50 --timestamp
```

---

### monit

Real-time monitoring dashboard.

```bash
tspm monit [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--refresh <ms>` | `-r` | Refresh interval (default: 1000ms) |

**Controls:**

| Key | Action |
|-----|--------|
| `q` | Quit |
| `↑/↓` | Navigate processes |
| `Enter` | Select process |

---

### describe

Show detailed process information.

```bash
tspm describe <process-name>
```

**Output Includes:**

- Process ID and name
- Status and uptime
- Command and arguments
- Environment variables
- Restart count and limits
- Health check status
- Resource usage

---

## Clustering Commands

### cluster

Show cluster information for a process.

```bash
tspm cluster [process-name]
```

**Output Includes:**

- Cluster instances
- Load balancing strategy
- Instance status
- Request distribution

---

### scale

Scale cluster instances up or down.

```bash
tspm scale <process-name> <count>
```

**Examples:**

```bash
# Scale to 4 instances
tspm scale my-api 4

# Scale to 8 instances
tspm scale my-api 8
```

---

### groups

Show all process groups and namespaces.

```bash
tspm groups
```

**Output Includes:**

- Namespace list
- Cluster groups
- Process count per group

---

## Development Commands

### dev

Development mode with hot reload.

```bash
tspm dev <config-file> [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--config <file>` | `-c` | Configuration file path |
| `--port <port>` | `-p` | API server port |
| `--host <host>` | `-h` | API server host |

**Features:**

- File watching with hot reload
- REST API for process management
- Real-time logs streaming

---

### serve

Static file server.

```bash
tspm serve <path> [port] [options]
```

**Options:**

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--port <port>` | `-p` | 3000 | Server port |
| `--host <host>` | `-h` | localhost | Server host |
| `--cache <seconds>` | `-c` | 0 | Cache duration |

**Examples:**

```bash
# Serve static files on port 8080
tspm serve ./public 8080

# Serve with caching
tspm serve ./public 8080 --cache 3600
```

---

## Deployment Commands

### deploy

Deploy to remote server via SSH.

```bash
tspm deploy [environment] [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--repo <url>` | `-r` | Git repository URL (overrides config) |
| `--local <path>` | `-l` | Local path to deploy (uses rsync) |
| `--verbose` | `-v` | Verbose output |
| `--config <file>` | `-c` | Configuration file |

**Examples:**

```bash
# Deploy to production
tspm deploy production

# Deploy to staging
tspm deploy staging

# Deploy with custom repo
tspm deploy production --repo https://github.com/user/repo.git

# Deploy from local directory
tspm deploy production --local ./dist
```

---

## Persistence Commands

### save

Save current process list to dump file.

```bash
tspm save [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--home <path>` | `-h` | TSPM home directory |

**Default Location:** `~/.tspm/dump.json`

---

### resurrect

Restore processes from dump file.

```bash
tspm resurrect [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--home <path>` | `-h` | TSPM home directory |

---

### startup

Generate system startup scripts.

```bash
tspm startup [platform] [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--user <user>` | `-u` | User to run as (default: current user) |

**Supported Platforms:**

- `systemd` (Linux) - default
- `launchd` (macOS) - coming soon

**Examples:**

```bash
# Generate systemd script
sudo tspm startup systemd -u deploy

# Auto-detect platform
sudo tspm startup -u deploy
```

---

### unstartup

Remove startup scripts.

```bash
tspm unstartup [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--force` | `-f` | Force removal without confirmation |

---

## Utility Commands

### flush

Clear all log files.

```bash
tspm flush
```

---

### reloadLogs

Reopen log files (useful for log rotation).

```bash
tspm reloadLogs [process-name]
tspm reloadLogs --all
```

---

### reset

Reset restart counters for processes.

```bash
tspm reset [process-name]
tspm reset --all
```

---

### prettylist

Pretty-printed JSON process list.

```bash
tspm prettylist [options]
```

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--raw` | `-r` | Output raw JSON |
| `--name <name>` | `-n` | Filter by process name |

---

### report

Generate diagnostic report.

```bash
tspm report [options]
```

**Output Includes:**

- System information
- TSPM version
- Node/Bun version
- Process list
- Configuration
- Resource usage
- Recent logs

**Options:**

| Option | Alias | Description |
|--------|-------|-------------|
| `--output <file>` | `-o` | Save report to file |
| `--json` | `-j` | Output as JSON |

---

### help

Show help information.

```bash
tspm help [command]
```

---

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Process not found |
| 4 | Permission denied |

---

## Related Documentation

- [Configuration Reference](CONFIG.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Startup Guide](STARTUP_GUIDE.md)

---

_Last Updated: 2026-02-13_
