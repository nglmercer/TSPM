const port = process.env.PORT || 3000;

console.log(`Dummy server running on port ${port}`);

Bun.serve({
  port,
  fetch(req) {
    return new Response("Hello from TSPM managed server!");
  },
});
