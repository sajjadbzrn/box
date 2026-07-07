import type { EnvStore } from "boxfw-core";

/**
 * Create an `EnvStore` backed by Bun's environment (Bun.env or process.env).
 *
 * In Bun, environment variables are available via `Bun.env` (preferred)
 * or the Node-compatible `process.env`.
 *
 * @example
 * ```ts
 * const app = new Box();
 * app.setEnv(bunEnv());
 * app.get("/", (c) => c.json({ node: c.env("NODE_ENV") }));
 * ```
 */
export function bunEnv(): EnvStore {
  return {
    get(key: string): unknown {
      if (typeof (globalThis as Record<string, unknown>)["Bun"] !== "undefined") {
        return (Bun.env as Record<string, string | undefined>)[key];
      }
      return (process.env as Record<string, string | undefined>)[key];
    },
  };
}
