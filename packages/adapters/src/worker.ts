import type { EnvStore } from "boxfw-core";

/**
 * Create an `EnvStore` wrapped around a Cloudflare Worker `env` object.
 *
 * Workers receive environment variables and bindings (KV, D1, R2, etc.)
 * as the second argument to the `fetch` handler.
 *
 * @example
 * ```ts
 * export default {
 *   async fetch(request: Request, env: Record<string, unknown>) {
 *     app.setEnv(workerEnv(env));
 *     return app.fetch(request);
 *   }
 * };
 * ```
 */
export function workerEnv(bindings: Record<string, unknown>): EnvStore {
  return {
    get(key: string): unknown {
      return bindings[key];
    },
  };
}
