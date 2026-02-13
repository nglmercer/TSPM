# TSPM Startup & Persistence Guide

This guide explains how to use TSPM's startup and persistence features to ensure your processes restart automatically after system reboots.

## Quick Start

### 1. Save Current Processes

After starting your processes, save them to a dump file:

```bash
# Start your processes
bun src/cli/index.ts start -c tspm.yaml

# Save the current process list
bun src/cli/index.ts save
```

This creates a dump file at `~/.tspm/dump.json` containing all running processes and their configurations.

### 2. Generate Startup Script (Linux/systemd)

Generate a systemd service to automatically start TSPM on boot:

```bash
# Generate startup script (requires sudo)
sudo bun src/cli/index.ts startup systemd -u $USER
```

This will:
- Create `/etc/systemd/system/tspm.service`
- Enable the service to start on boot
- Start the service immediately

### 3. Verify

Check that the service is running:

```bash
sudo systemctl status tspm
```

## Commands

### `save`

Saves the current process list to `~/.tspm/dump.json`.

```bash
bun src/cli/index.ts save
```

**Use case**: After configuring and starting your processes, run this command to persist them for later resurrection.

---

### `resurrect`

Restores all processes from the dump file.

```bash
bun src/cli/index.ts resurrect
```

**Use case**: After a system reboot or if TSPM daemon crashes, use this to restore all previously saved processes.

**Note**: This command acts as a daemon and keeps running, so it's typically used by the systemd service.

---

### `startup [platform]`

Generates a system startup script for the specified platform.

**Supported platforms**:
- `systemd` (Linux - default)
- More platforms coming soon (launchd for macOS, openrc, etc.)

```bash
# Generate systemd service (requires root)
sudo bun src/cli/index.ts startup systemd -u your_username
```

**Options**:
- `-u, --user <user>`: User to run the service as (default: current user)

**What it does**:
1. Detects the `bun` executable path
2. Creates a systemd unit file at `/etc/systemd/system/tspm.service`
3. Enables the service to start on boot
4. Starts the service immediately
5. Saves startup info to `~/.tspm/startup/startup.json`

**Service details**:
- **Type**: simple
- **Command**: `bun <path-to-tspm> resurrect`
- **Restart policy**: On failure (with 10s delay)
- **Runs as**: Specified user
- **After**: network.target

---

### `unstartup`

Removes the startup script (systemd service).

```bash
# Remove systemd service (requires root)
sudo bun src/cli/index.ts unstartup
```

**What it does**:
1. Stops the TSPM service
2. Disables the service
3. Removes the systemd unit file
4. Reloads systemd daemon

---

## Workflow Example

### Production Server Setup

```bash
# 1. Start your processes from config
bun src/cli/index.ts start -c production.yaml

# 2. Verify processes are running
bun src/cli/index.ts list

# 3. Save the process list
bun src/cli/index.ts save

# 4. Install startup script (requires sudo)
sudo bun src/cli/index.ts startup systemd -u $(whoami)

# 5. Verify service is active
sudo systemctl status tspm
```

### After System Reboot

The systemd service will automatically:
1. Start on boot (after network is available)
2. Run `bun <path-to-tspm> resurrect`
3. Restore all saved processes
4. Restart on failure with exponential backoff

### Manual Resurrection

If you need to manually restore processes without the systemd service:

```bash
# Restore all saved processes
bun src/cli/index.ts resurrect
```

---

## File Locations

| File/Directory | Purpose |
| -------------- | ------- |
| `~/.tspm/` | TSPM home directory |
| `~/.tspm/dump.json` | Saved process list (used by `save`/`resurrect`) |
| `~/.tspm/status.json` | Current running processes status |
| `~/.tspm/startup/startup.json` | Startup script metadata |
| `/etc/systemd/system/tspm.service` | systemd service file (Linux) |

---

## Troubleshooting

### Service fails to start

```bash
# Check service logs
sudo journalctl -u tspm -n 50

# Check service status
sudo systemctl status tspm
```

### Processes not restoring

1. Verify dump file exists:
   ```bash
   cat ~/.tspm/dump.json
   ```

2. Check if processes are in dump:
   ```bash
   bun src/cli/index.ts save
   ```

### Permission issues

Make sure:
- The service user has permissions to access the script and config files
- The `TSPM_HOME` directory is writable by the service user
- Log directories are writable

---

## Advanced Usage

### Custom TSPM Home Directory

Set a custom TSPM home directory:

```bash
export TSPM_HOME=/var/lib/tspm
bun src/cli/index.ts save
```

### Multiple Environments

You can maintain different dump files for different environments:

```bash
# Production
TSPM_HOME=~/.tspm-prod bun src/cli/index.ts save
sudo TSPM_HOME=/home/user/.tspm-prod bun src/cli/index.ts startup systemd

# Staging
TSPM_HOME=~/.tspm-staging bun src/cli/index.ts save
```

---

## Notes

- **Systemd only**: Currently, only systemd (Linux) is supported. Support for macOS (launchd), Windows (services), and other init systems is planned.
- **Root required**: Installing/removing startup scripts requires root/sudo privileges.
- **Bun path**: The startup script uses the `bun` executable found in your PATH at the time of generation.
- **Process configs**: The dump file contains full process configurations, including environment variables and scripts.

---

_Last Updated: 2026-02-13_
_Phase 7.1 Complete: Startup & Persistence_
