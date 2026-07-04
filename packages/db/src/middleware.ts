import type { Middleware } from "boxfw-core";

/**
 * `D` creates a middleware that injects a Drizzle ORM client into the request context.
 *
 * The client is stored on `c.__db` and is accessible via `c.db`
 * (a getter added to `Context` by `box-db`).
 *
 * For typed access, use `createDbCtx<T>()` from this package.
 *
 * @example
 * ```ts
 * import { drizzle } from "drizzle-orm/bun-sqlite";
 * import { D, createDbCtx } from "boxfw-db";
 *
 * const orm = drizzle(sqlite, { schema });
 * app.use(D(orm));
 *
 * const db = createDbCtx<typeof orm>();
 * app.get("/users", async (c) => {
 *   const rows = await db(c).select().from(users);
 *   return c.json(rows);
 * });
 * ```
 *
 * @example
 * ```ts
 * // Factory form — for per-request client creation (e.g., D1 bindings)
 * app.use(D((c) => drizzle(c.env("DB"))));
 * ```
 */
export function D<C>(clientOrFactory: C | ((c: import("boxfw-core").Context) => C)): Middleware {
  return async (c, next) => {
    const client = typeof clientOrFactory === "function"
      ? (clientOrFactory as (c: import("boxfw-core").Context) => C)(c)
      : clientOrFactory;

    (c as Record<string, unknown>).__db = client;
    return next();
  };
}
