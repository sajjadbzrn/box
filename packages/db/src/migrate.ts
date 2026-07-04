import type { MigrateConfig, DbDriver } from "./types";

/**
 * Unified migration runner for Drizzle ORM.
 *
 * Dispatches to the correct per-driver migrator based on the `driver` field.
 *
 * @example
 * ```ts
 * // Bun SQLite
 * await migrate({ driver: "bun-sqlite", db: orm, migrationsFolder: "./drizzle" });
 *
 * // Cloudflare D1
 * await migrate({ driver: "d1", db: orm, migrationsFolder: "./drizzle" });
 * ```
 */
export async function migrate(config: MigrateConfig): Promise<void> {
  const runner = getMigrator(config.driver);
  await runner(config.db, config.migrationsFolder);
}

async function getMigrator(driver: DbDriver): Promise<(db: unknown, folder: string) => Promise<void>> {
  switch (driver) {
    case "bun-sqlite": {
      const { migrate } = await import("drizzle-orm/bun-sqlite/migrator");
      return (db, folder) => migrate(db as Parameters<typeof migrate>[0], { migrationsFolder: folder });
    }
    case "d1": {
      const { migrate } = await import("drizzle-orm/d1/migrator");
      return (db, folder) => migrate(db as Parameters<typeof migrate>[0], { migrationsFolder: folder });
    }
    case "pg": {
      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      return (db, folder) => migrate(db as Parameters<typeof migrate>[0], { migrationsFolder: folder });
    }
  }
}
