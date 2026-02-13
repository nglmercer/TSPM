const port = process.env.PORT || 3000;
let healthy = true;

console.log(`[Server] Starting on port ${port}...`);

const server = Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    
    // Health check endpoint
    if (url.pathname === "/health") {
      if (healthy) {
        return new Response("OK", { status: 200 });
      } else {
        return new Response("Unhealthy", { status: 503 });
      }
    }
    
    // Toggle health status
    if (url.pathname === "/toggle-health") {
      healthy = !healthy;
      return new Response(`Health status toggled to: ${healthy}`);
    }
    
    // Crash endpoint for testing restart
    if (url.pathname === "/crash") {
      console.error("[Server] Crashing as requested...");
      process.exit(1);
    }
    
    // Heavy load simulation endpoint
    if (url.pathname === "/load") {
      const start = Date.now();
      while (Date.now() - start < 1000) {
        // High CPU usage for 1s
        Math.random() * Math.random();
      }
      return new Response("Heavy load processing complete");
    }

    return new Response(`Hello from TSPM managed server! (Instance: ${process.env.TSPM_INSTANCE_ID || 'single'})`);
  },
});

console.log(`[Server] Listening on http://localhost:${server.port}`);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("[Server] Received SIGTERM, shutting down...");
  process.exit(0);
});
