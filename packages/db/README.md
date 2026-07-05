# boxfw-db

[![npm version](https://badge.fury.io/js/boxfw-db.svg)](https://www.npmjs.com/package/boxfw-db)

First-class **Drizzle ORM** integration for **Box Framework** — middleware, migration runner, and connection helpers for Bun SQLite, Cloudflare D1, and PostgreSQL.

## Installation

```bash
bun add boxfw-db
```

> Requires `boxfw-core` and `drizzle-orm` as peer dependencies.

## Quick Start

```ts
import { Box } from "boxfw-core";
import { D, createDbCtx } from "boxfw-db";
import { drizzle } from "drizzle-orm/bun-sqlite";
import Database from "bun:sqlite";
import * as schema from "./schema";

const sqlite = new Database("data.db");
const orm = drizzle(sqlite, { schema });

const app = new Box();
app.use(D(orm));

const db = createDbCtx<typeof orm>();

app.get("/users", async (c) => {
  const rows = await db(c).select().from(schema.users);
  return c.json(rows);
});
```

## Features

- **Drizzle middleware** — injects the ORM client into every request context via `D()`
- **Unified migration runner** — `migrate()` dispatches to the correct Drizzle migrator based on driver
- **Per-request factories** — create fresh clients per request (useful for D1 bindings)
- **Driver support** — `bun-sqlite`, `d1` (Cloudflare), `pg` (PostgreSQL)

## API

```ts
// Inject client as middleware
app.use(D(client));

// Inject factory (per-request)
app.use(D((c) => drizzle(c.env("DB"))));

// Migration (async, run at startup)
import { migrate } from "boxfw-db";
await migrate({ driver: "bun-sqlite", db: orm, migrationsFolder: "./drizzle" });
```

## License

MIT — see the [LICENSE](LICENSE) file for details.
