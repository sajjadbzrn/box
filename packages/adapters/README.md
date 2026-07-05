# boxfw-adapters

[![npm version](https://badge.fury.io/js/boxfw-adapters.svg)](https://www.npmjs.com/package/boxfw-adapters)

Dual-runtime adapters for **Box Framework** — seamlessly run the same code on Bun and Cloudflare Workers.

## Installation

```bash
bun add boxfw-adapters
```

> Requires `boxfw-core` as a peer dependency.

## Quick Start

```ts
import { Box } from "boxfw-core";
import { bunEnv } from "boxfw-adapters";

const app = new Box();
app.setEnv(bunEnv());

app.get("/", (c) => c.json({ node: c.env("NODE_ENV") }));
app.listen({ port: 3000 });
```

## Cloudflare Worker

```ts
import { Box } from "boxfw-core";
import { workerEnv } from "boxfw-adapters";

const app = new Box();

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
```

## API

| Function | Runtime | Description |
|----------|---------|-------------|
| `bunEnv()` | Bun | Returns an `EnvStore` backed by `Bun.env` / `process.env` |
| `workerEnv(bindings)` | Cloudflare Workers | Returns an `EnvStore` from the Worker `env` bindings |

## License

MIT — see the [LICENSE](LICENSE) file for details.
