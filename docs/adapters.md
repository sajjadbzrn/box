# Box Adapters — Phase 2

Dual-runtime support: write once, run on Bun and Cloudflare Workers.

## The problem

Bun and Cloudflare Workers access environment variables and bindings differently:

| Concern | Bun | Cloudflare Workers |
|---------|-----|--------------------|
| Env vars | `process.env.KEY` or `Bun.env.KEY` | `env.KEY` (passed to `fetch`) |
| DB bindings | Direct import (Drizzle + SQLite/Postgres) | `env.DB` (D1 binding) |
| Server start | `app.listen({ port })` | `export default { fetch }` |
| KV storage | N/A (use Redis/SQLite) | `env.MY_KV` (KV binding) |

Box abstracts this behind a single `EnvStore` interface.

## How it works

### `EnvStore` interface

```ts
interface EnvStore {
  get(key: string): unknown;
}
```

Two implementations:

- `bunEnv()` — reads from `process.env`
- `workerEnv(bindings)` — wraps a Worker `env` object

### Using on Bun

```ts
import { Box } from "box-core";
import { bunEnv } from "box-adapters";

const app = new Box();
app.setEnv(bunEnv());

app.get("/info", (c) => {
  const db = c.env("DATABASE_URL");
  return c.json({ db });
});

app.listen({ port: 3000 });
```

### Using on Cloudflare Workers

```ts
import { Box } from "box-core";
import { workerEnv } from "box-adapters";

const app = new Box();

app.get("/info", (c) => {
  const db = c.env("DATABASE_URL");
  // Also works with typed bindings:
  const kv = c.env<KVNamespace>("KV_STORE");
  return c.json({ db, kv: kv ? "present" : "absent" });
});

export default {
  fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
```

The route definitions, middleware, and `c.env()` access are **identical** in both examples.

## API Reference

### `c.env<T>(key)`

Read an environment variable or binding from the configured `EnvStore`.

- `T` defaults to `string` for env vars, but can be typed for bindings:
  ```ts
  const db = c.env<D1Database>("DB");
  const kv = c.env<KVNamespace>("MY_KV");
  ```
- Returns `undefined` if the key doesn't exist.
- Works identically on Bun and Workers.

### `app.setEnv(store)`

Set the app-level `EnvStore`. Called once at startup.

On Bun, this is typically `bunEnv()`.
On Workers, this is called inside the `fetch` handler with `workerEnv(env)`.

### `app.fetch(request, env?)`

The core request handler. Accepts an optional `EnvStore` as the second argument for per-request env overrides.

- Without second arg: uses the app-level env store (set via `setEnv()`)
- With second arg: overrides the env for this request only

### `bunEnv()`

Creates an `EnvStore` that reads from `process.env` (Node-compatible) or `Bun.env`.

### `workerEnv(bindings)`

Creates an `EnvStore` that wraps a plain object — typically the `env` argument from a Cloudflare Worker's `fetch` handler.

## How it's zero-cost

The `EnvStore` interface is defined in `box-core` but has no default implementation. The implementations (`bunEnv`, `workerEnv`) live in `box-adapters`, which depends on core, not the other way around. If you don't import `box-adapters`, no runtime-specific code is bundled.
