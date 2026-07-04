import type { Context } from "boxfw-core";

/**
 * Create a typed accessor for the Drizzle client injected by the `D()` middleware.
 *
 * @example
 * ```ts
 * const db = createDbCtx<typeof orm>();
 * app.get("/users", async (c) => {
 *   const rows = await db(c).select().from(users); // fully typed
 *   return c.json(rows);
 * });
 * ```
 */
export function createDbCtx<T>() {
  return (c: Context): T => {
    const client = (c as unknown as Record<string, unknown>).__db;
    return client as T;
  };
}
