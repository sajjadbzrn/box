/**
 * Convenience factories to create Drizzle clients for common runtimes.
 *
 * These are optional — you can always construct your own drizzle instance
 * and pass it to `D()`.
 */

/**
 * Create a Drizzle client backed by Bun's built-in SQLite.
 *
 * @example
 * ```ts
 * import { createBunSqlite } from "boxfw-db";
 *
 * const db = createBunSqlite({ path: "app.db", schema: mySchema });
 * ```
 */
export async function createBunSqlite(options: { path: string; schema: Record<string, unknown> }): Promise<unknown> {
  const { Database } = await import("bun:sqlite");
  const { drizzle } = await import("drizzle-orm/bun-sqlite");
  const sqlite = new Database(options.path, { create: true });
  return drizzle(sqlite, { schema: options.schema });
}

/**
 * Create a Drizzle client backed by a Cloudflare D1 binding.
 *
 * @example
 * ```ts
 * import { createD1Client } from "boxfw-db";
 *
 * // In a Worker handler:
 * app.use(D((c) => createD1Client(c.env("DB"), mySchema)));
 * ```
 */
export async function createD1Client(binding: unknown, schema: Record<string, unknown>): Promise<unknown> {
  const { drizzle } = await import("drizzle-orm/d1");
  return drizzle(binding, { schema });
}
