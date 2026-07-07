/**
 * =========================================================================
 *  DATABASE SCHEMA — Drizzle ORM with SQLite
 * =========================================================================
 *
 * This file defines:
 *   1. The database schema (tables for users and tasks)
 *   2. The database initialization (SQLite via Bun)
 *   3. A typed accessor for use in route handlers
 *
 * Box Framework integrates with Drizzle ORM via the `boxfw-db` package.
 * The `D()` middleware injects the ORM client into the request context.
 * The `createDbCtx()` helper gives you a fully typed `db()` accessor.
 *
 * @see https://orm.drizzle.team/docs/overview
 * =========================================================================
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { D, createDbCtx } from "boxfw-db";

// ═════════════════════════════════════════════════════════════════════════
//  1. TABLES
// ═════════════════════════════════════════════════════════════════════════

/**
 * Users table — stores registered users.
 *
 * Drizzle's `sqliteTable` function defines a SQLite table with full
 * TypeScript type inference. Each column is typed (text, integer, etc.)
 * and constraints (primaryKey, notNull, unique) are specified inline.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  /** bcrypt-hashed password (yes, we hash in-memory for this demo) */
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

/**
 * Tasks table — the core entity of our Task Manager.
 *
 * Features demonstrated:
 * - Foreign key reference to users (via userId)
 * - Enum-like status field using text with default
 * - Priority field for sorting/filtering
 * - Timestamps for created_at and updated_at
 */
export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** The user who owns this task (FK to users.id) */
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  /** Status: "todo" | "in_progress" | "done" | "cancelled" */
  status: text("status").notNull().default("todo"),
  /** Priority: "low" | "medium" | "high" | "urgent" */
  priority: text("priority").notNull().default("medium"),
  /** ISO-8601 due date (optional) */
  dueDate: text("due_date"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ═════════════════════════════════════════════════════════════════════════
//  2. DATABASE INITIALIZATION
// ═════════════════════════════════════════════════════════════════════════

/**
 * Create and initialize the SQLite database.
 *
 * This function:
 * 1. Opens (or creates) a SQLite file
 * 2. Creates the Drizzle ORM client
 * 3. Auto-creates tables (dev convenience — use migrations in production)
 * 4. Returns the ORM client ready for `D()` middleware
 */
export function createDatabase() {
  const sqlite = new Database("taskmanager.db", { create: true });

  // Enable WAL mode for better concurrent read performance
  sqlite.run("PRAGMA journal_mode = WAL;");
  sqlite.run("PRAGMA foreign_keys = ON;");

  const db = drizzle(sqlite, { schema: { users, tasks } });

  // ── Auto-create tables (dev only! Use drizzle-kit for production) ──
  sqlite.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
  );

  sqlite.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
  );

  return db;
}

/**
 * Typed DB accessor — use this in route handlers to get a fully typed
 * Drizzle client for the current request.
 *
 * Usage:
 * ```ts
 * import { db } from "./db";
 * const rows = await db(c).select().from(schema.tasks);
 * ```
 */
export const typedDb = createDbCtx<ReturnType<typeof createDatabase>>();

/** Re-export the D() middleware so routes can import from a single place */
export { D };
