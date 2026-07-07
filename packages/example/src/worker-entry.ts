/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLOUDFLARE WORKER ENTRY POINT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This file demonstrates that the **exact same app code** works on
 * Cloudflare Workers. The only difference is:
 *
 *   1. Environment variables come from the `env` parameter instead of
 *      `process.env` — the `workerEnv()` adapter handles this.
 *   2. WebSocket and SQLite are not available on Workers (use D1 + WebSocketPair).
 *   3. The entry point exports a Worker `fetch` handler instead of calling
 *      `app.listen()`.
 *
 * Everything else — routes, middleware, validation, auth, i18n — is
 * **completely identical** to the Bun version.
 *
 * @see https://developers.cloudflare.com/workers/
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { workerEnv } from "boxfw-adapters";
import { app } from "./index";

export default {
  /**
   * Workers `fetch` handler — replaces `app.listen()` from the Bun version.
   *
   * The `env` parameter contains bindings (D1, KV, R2, etc.) and
   * environment variables. The `workerEnv()` adapter wraps these into
   * the same `EnvStore` interface that `c.env()` uses in route handlers.
   */
  async fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
