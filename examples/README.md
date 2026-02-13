# TSPM Examples

This directory contains example configurations and applications to help you get started with TSPM.

## Directory Structure

- `applications/`: Source code for example applications.
  - `server.ts`: A simple HTTP server with health check endpoints.
  - `worker.ts`: A worker process simulation.
- `config/`: Configuration files demonstrating various TSPM features.
  - `app.basic.yaml`: Simple configuration for basic process management.
  - `app.cluster.yaml`: Configuration for clustered applications with load balancing.
  - `app.full.jsonc`: Comprehensive configuration file documenting all available options.
- `legacy/`: Older example configurations (archived).

## Running Examples

To run these examples, you can use the TSPM CLI from the root directory.

### Basic Example

Start a simple server and worker process:

```bash
bun start --config examples/config/app.basic.yaml
```

### Cluster Example

Start a clustered API server with load balancing:

```bash
bun start --config examples/config/app.cluster.yaml
```

### Full Configuration

Run a process using the comprehensive JSONC configuration:

```bash
bun start --config examples/config/app.full.jsonc
```

## Application Endpoints

The example `server.ts` exposes the following endpoints for testing:

- `GET /`: Hello world message with instance ID.
- `GET /health`: Health check (returns 200 OK or 503 Unhealthy).
- `GET /toggle-health`: Toggles the health status (for testing health checks).
- `GET /crash`: Forces the server to crash (for testing auto-restart).
- `GET /load`: Simulates high CPU load.

The example `worker.ts` simulates a background task and can be configured via environment variables to simulate memory leaks or crashes.
