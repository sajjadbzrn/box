/**
 * Supported database drivers for the migration runner.
 */
export type DbDriver = "bun-sqlite" | "d1" | "pg";

/**
 * Configuration for the `migrate()` function.
 */
export interface MigrateConfig {
  driver: DbDriver;
  db: unknown;
  migrationsFolder: string;
}
