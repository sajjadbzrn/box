/**
 * Cloudflare Worker entry point.
 *
 * This demonstrates that the SAME app code works as a Worker.
 * The route definitions, middleware, and `c.env()` access are
 * identical to the Bun version — only the entry wrapper differs.
 *
 * Usage: conceptually deployable to Cloudflare Workers with:
 *   wrangler dev --local
 */

import { Box } from "boxfw-core";
import { workerEnv } from "boxfw-adapters";

const app = new Box();

// ---- Routes (identical to Bun example!) ----
app.use(async (c, next) => {
  const start = Date.now();
  console.log(`→ ${c.method} ${c.path}`);
  const res = await next();
  console.log(`← ${c.method} ${c.path} — ${res.status} (${Date.now() - start}ms)`);
  return res;
});

app.get("/", (c) => {
  const nodeEnv = c.env("NODE_ENV") ?? "development";
  return c.json({
    runtime: "Cloudflare Worker",
    env: nodeEnv,
    message: "Box runs everywhere",
  });
});

app.get("/config", (c) => {
  return c.json({
    database: c.env("DATABASE_URL") ?? "not set",
    dbBinding: c.env("DB") ? "present" : "absent",
    debug: c.env("DEBUG") ?? "false",
  });
});

/**
 * Worker fetch handler.
 *
 * This is the ONLY runtime-specific code.
 * Everything else (routes, middleware, context) is identical.
 */
export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
