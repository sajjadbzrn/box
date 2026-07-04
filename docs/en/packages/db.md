# DB — Drizzle ORM Integration

The `boxfw-db` package provides first-class Drizzle ORM integration with a migration runner that works across Bun SQLite, Cloudflare D1, and PostgreSQL.

## Installation

```bash
bun add boxfw-db drizzle-orm

# Driver (pick one):
bun add drizzle-orm/bun-sqlite   # Bun SQLite (built-in)
bun add drizzle-orm/pg            # PostgreSQL
```

## Quick Start

```ts
import { Box } from "boxfw-core";
import { D, createDbCtx, createBunSqlite } from "boxfw-db";
import * as schema from "../drizzle/schema";

// 1. Create Drizzle client
const orm = await createBunSqlite({ path: "app.db", schema });

// 2. Create typed accessor
const db = createDbCtx<typeof orm>();

// 3. Inject via middleware
const app = new Box();
app.use(D(orm));

// 4. Use in handlers — fully typed!
app.get("/users", async (c) => {
  const users = await db(c).select().from(schema.users);
  return c.json(users);
});
```

## Middleware

### Static Client

```ts
app.use(D(orm));
```

### Factory Form

For per-request clients (D1 bindings, multi-tenant):

```ts
app.use(D((c) => drizzle(c.env("DB"), { schema })));
```

## Typed Access

```ts
const db = createDbCtx<typeof orm>();

app.get("/users/:id", async (c) => {
  const [user] = await db(c)
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, Number(c.params.id)));

  return user ? c.json(user) : c.text("Not Found", 404);
});
```

## Running Migrations

```ts
import { migrate } from "boxfw-db";

// Bun SQLite
await migrate({ driver: "bun-sqlite", db: orm, migrationsFolder: "./drizzle" });

// Cloudflare D1
await migrate({ driver: "d1", db: orm, migrationsFolder: "./drizzle" });

// PostgreSQL
await migrate({ driver: "pg", db: orm, migrationsFolder: "./drizzle" });
```

Generate migrations with `drizzle-kit`:

```bash
bunx drizzle-kit generate
```

## Helpers

### `createBunSqlite(options)`

```ts
const db = await createBunSqlite({
  path: "app.db",        // File path
  schema: mySchema,       // Drizzle schema
});
```

### `createD1Client(binding, schema)`

```ts
// In a Worker handler:
app.use(D((c) => createD1Client(c.env("DB"), mySchema)));
```

## Runtime Support

| Runtime | Driver | Status |
|---------|--------|--------|
| Bun | `bun:sqlite` (built-in) | ✅ First-class |
| Cloudflare Workers | D1 binding | ✅ First-class |
| Bun / Node | PostgreSQL | ✅ Supported |
| Bun / Node | Turso / LibSQL | Via `drizzle-orm/libsql` |

---

> 📚 [Back to Index](../index.md) · [Previous: Adapters](adapters.md) · [Next: Auth](auth.md)
