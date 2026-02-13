const instanceId = process.env.TSPM_INSTANCE_ID || 'single';
console.log(`[Worker:${instanceId}] Worker started...`);

let counter = 0;

// Heartbeat
setInterval(() => {
  counter++;
  console.log(`[Worker:${instanceId}] Heartbeat #${counter} at ${new Date().toISOString()}`);
}, 5000);

// Simulate variable memory usage
if (process.env.SIMULATE_MEMORY_LEAK === 'true') {
  const leak: any[] = [];
  setInterval(() => {
    // Add 1MB every second
    leak.push(new Array(1024 * 1024 / 8).fill(0));
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`[Worker:${instanceId}] Memory usage: ${Math.round(used * 100) / 100} MB`);
  }, 1000);
}

// Simulate a crash if configured
if (process.env.SIMULATE_CRASH_AFTER) {
  const delay = parseInt(process.env.SIMULATE_CRASH_AFTER);
  setTimeout(() => {
    console.error(`[Worker:${instanceId}] Crashing as requested after ${delay}ms...`);
    process.exit(1);
  }, delay);
}

// Handle signals
process.on('SIGTERM', () => {
  console.log(`[Worker:${instanceId}] Received SIGTERM, cleaning up...`);
  setTimeout(() => process.exit(0), 500); // Simulate cleanup time
});
