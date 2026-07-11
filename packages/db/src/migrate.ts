import type { DbDriver, MigrateConfig } from "./types";

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
  const { db, migrationsFolder, driver } = config;
  await runMigration(driver, db, migrationsFolder);
}

async function runMigration(driver: DbDriver, db: unknown, migrationsFolder: string): Promise<void> {
  switch (driver) {
    case "bun-sqlite": {
      const { migrate } = await import("drizzle-orm/bun-sqlite/migrator");
      await migrate(db as never, { migrationsFolder });
      return;
    }
    case "d1": {
      const { migrate } = await import("drizzle-orm/d1/migrator");
      await migrate(db as never, { migrationsFolder });
      return;
    }
    case "pg": {
      const { migrate } = await import("drizzle-orm/node-postgres/migrator");
      await migrate(db as never, { migrationsFolder });
      return;
    }
  }
}
