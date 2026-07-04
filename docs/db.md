# Box DB — Phase 3

First-class Drizzle ORM integration for Box.

## Installation

```bash
bun add box-db drizzle-orm

# Driver-specific (pick one):
# Bun SQLite: built-in, no extra dep
# Cloudflare D1: no extra dep (uses Worker binding)
# Postgres: bun add drizzle-orm/pg
```

## Quick start

```ts
import { Box } from "box-core";
import { D, createDbCtx } from "box-db";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

// 1. Create Drizzle client
const sqlite = new Database("app.db");
const orm = drizzle(sqlite, { schema: mySchema });

// 2. Create typed accessor
const db = createDbCtx<typeof orm>();

// 3. Inject via middleware
const app = new Box();
app.use(D(orm));

// 4. Use in handlers — fully typed!
app.get("/users", async (c) => {
  const users = await db(c).select().from(users);
  return c.json(users);
});

app.post("/users", async (c) => {
  const body = await c.req.json();
  await db(c).insert(users).values(body);
  return c.json({ ok: true }, 201);
});

app.listen({ port: 3000 });
```

## API Reference

### `D(client)` / `D(factory)`

Middleware that injects a Drizzle client into `c.__db`.

```ts
// Static client (most common)
app.use(D(orm));

// Factory form — for per-request clients (D1 bindings, multi-tenant)
app.use(D((c) => drizzle(c.env("DB"), { schema })));
```

### `createDbCtx<T>()`

Creates a typed accessor function that extracts the Drizzle client from context with full type inference.

```ts
const db = createDbCtx<typeof orm>();

app.get("/users", async (c) => {
  const rows = await db(c).select().from(users); // typed!
});
```

### `c.db`

A getter on `Context` that returns the injected Drizzle client (untyped — use `createDbCtx<T>()` for type safety).

```ts
app.get("/raw", async (c) => {
  const rows = await (c.db as typeof orm).select().from(users);
});
```

### `migrate(config)`

Unified migration runner. Dispatches to the correct Drizzle migrator based on `driver`.

```ts
import { migrate } from "box-db";

// Bun SQLite
await migrate({ driver: "bun-sqlite", db: orm, migrationsFolder: "./drizzle" });

// Cloudflare D1
await migrate({ driver: "d1", db: orm, migrationsFolder: "./drizzle" });

// Postgres
await migrate({ driver: "pg", db: orm, migrationsFolder: "./drizzle" });
```

For generating migrations, use `drizzle-kit` directly:

```bash
npx drizzle-kit generate
```

### `createBunSqlite(options)`

Convenience factory for Bun SQLite.

```ts
import { createBunSqlite } from "box-db";

const db = await createBunSqlite({
  path: "app.db",
  schema: mySchema,
});
```

### `createD1Client(binding, schema)`

Convenience factory for Cloudflare D1 bindings.

```ts
import { createD1Client } from "box-db";

export default {
  async fetch(req, env) {
    const db = await createD1Client(env.DB, mySchema);
    app.use(D(db));
    return app.fetch(req);
  }
};
```

## Runtime support

| Runtime | Driver | Status |
|---------|--------|--------|
| Bun | `bun:sqlite` (built-in) | First-class |
| Cloudflare Workers | D1 binding | First-class |
| Node / Bun | `pg` / `postgres` | Supported via `drizzle-orm/pg` |
| Bun / Node | Turso / LibSQL | Via `drizzle-orm/libsql` (manual setup) |
