console.log("Worker started...");

setInterval(() => {
  console.log(`Worker heartbeat at ${new Date().toISOString()}`);
}, 5000);

// Simulate a crash every 20 seconds
setTimeout(() => {
  console.error("Worker crashing for testing...");
  process.exit(1);
}, 20000);
