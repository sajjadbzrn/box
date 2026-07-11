/**
 * Box vs Hono benchmark.
 *
 * Compares raw throughput by calling the `fetch` handler directly
 * (no network overhead), measuring wall-clock time for 200k requests.
 *
 * Usage: bun run packages/benchmark/src/run-bench.ts
 */

import { Box } from "boxfw-core";
import { Hono } from "hono";

const WARMUP = 10_000;
const ITERATIONS = 200_000;

function buildRequest(path: string): Request {
  return new Request(`http://localhost:3000${path}`);
}

function bench(name: string, fetch: (req: Request) => Promise<Response>, path: string) {
  // Warmup
  for (let i = 0; i < WARMUP; i++) {
    fetch(buildRequest(path));
  }

  Bun.gc(true);

  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    fetch(buildRequest(path));
  }
  const elapsed = performance.now() - start;
  const rps = Math.round((ITERATIONS / elapsed) * 1000);

  console.log(
    `  ${name.padEnd(6)}  ${String(ITERATIONS).padStart(7)} req  ${elapsed.toFixed(2).padStart(8)} ms  ${String(rps).padStart(7)} req/s`,
  );
  return rps;
}

// ---- Box ----
const boxApp = new Box();
boxApp.get("/", (c) => c.text("Hello, Box!"));
boxApp.get("/user/:id", (c) => c.json({ id: c.params.id }));

// ---- Hono ----
const honoApp = new Hono();
honoApp.get("/", (c) => c.text("Hello, Hono!"));
honoApp.get("/user/:id", (c) => c.json({ id: c.req.param("id") }));

// ---- Run benchmarks ----
console.log("\nBox vs Hono Benchmark");
console.log("=".repeat(50));
console.log(`Iterations: ${ITERATIONS.toLocaleString()} requests\n`);

console.log("Route: GET /");
const boxStatic = bench("Box", (r) => boxApp.fetch(r), "/");
const honoStatic = bench("Hono", (r) => honoApp.fetch(r), "/");

console.log("\nRoute: GET /user/:id");
const boxParam = bench("Box", (r) => boxApp.fetch(r), "/user/42");
const honoParam = bench("Hono", (r) => honoApp.fetch(r), "/user/42");

console.log("\n--- Summary ---");
console.log(
  `Static route: Box ${boxStatic.toLocaleString()} vs Hono ${honoStatic.toLocaleString()} req/s (${((boxStatic / honoStatic) * 100).toFixed(1)}%)`,
);
console.log(
  `Param route:  Box ${boxParam.toLocaleString()} vs Hono ${honoParam.toLocaleString()} req/s (${((boxParam / honoParam) * 100).toFixed(1)}%)`,
);
console.log();
