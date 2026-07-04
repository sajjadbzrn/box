# Adapters — Dual Runtime Support

The `boxfw-adapters` package provides runtime-neutral environment variable access for Bun and Cloudflare Workers, so you write once and run on both runtimes.

## Installation

```bash
bun add boxfw-adapters
```

## The Problem

Bun and Cloudflare Workers access environment variables differently:

| Concern      | Bun                                | Cloudflare Workers                |
| ------------ | ---------------------------------- | --------------------------------- |
| Env vars     | `Bun.env.KEY` or `process.env.KEY` | `env.KEY` (second arg to `fetch`) |
| Server start | `app.listen()`                     | `export default { fetch }`        |

Box abstracts this behind the `EnvStore` interface.

## Using on Bun

```ts
import { Box } from "boxfw-core";
import { bunEnv } from "boxfw-adapters";

const app = new Box();
app.setEnv(bunEnv());

app.get("/", (c) => {
  const dbUrl = c.env("DATABASE_URL");
  return c.json({ dbUrl });
});

app.listen({ port: 3000 });
```

## Using on Cloudflare Workers

```ts
import { Box } from "boxfw-core";
import { workerEnv } from "boxfw-adapters";

const app = new Box();

app.get("/", (c) => {
  const dbUrl = c.env("DATABASE_URL");
  const kv = c.env<KVNamespace>("KV_STORE");
  return c.json({ dbUrl, kv: kv ? "present" : "absent" });
});

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
```

All route definitions, middleware, and `c.env()` calls are **identical** in both examples.

## API

| Function              | Description                                     |
| --------------------- | ----------------------------------------------- |
| `bunEnv()`            | Creates EnvStore from `Bun.env` / `process.env` |
| `workerEnv(bindings)` | Wraps Worker `env` object as EnvStore           |
| `c.env(key)`          | Read env variable typed as `T`                  |

## How It Works

```text
                       ┌─────────────┐
                       │   Your App  │
                       │  c.env("DB")│
                       └──────┬──────┘
                              │
                    ┌─────────┴─────────┐
                    │  EnvStore (iface) │
                    └─────────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         bunEnv()        workerEnv()     custom impl
              │               │               │
         Bun.env      Worker env arg      Redis, etc.
```

---

> 📚 [Back to Index](../index.md) · [Previous: Validator](validator.md) · [Next: DB](db.md)
