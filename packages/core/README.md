# boxfw-core

[![npm version](https://badge.fury.io/js/boxfw-core.svg)](https://www.npmjs.com/package/boxfw-core)

The core runtime of **Box Framework** — a radix-tree router, typed context, onion middleware, and WebSocket support for Bun and Cloudflare Workers.

## Installation

```bash
bun add boxfw-core
```

## Quick Start

```ts
import { Box } from "boxfw-core";

const app = new Box();

app.get("/", (c) => c.text("Hello, Box!"));
app.get("/user/:id", (c) => c.json({ id: c.params.id }));

app.listen({ port: 3000 });
```

## Features

- **Radix-tree router** — fast routing with static, dynamic (`:id`), and wildcard (`*`) patterns
- **Onion middleware** — composable pipeline with full type safety
- **WebSocket** — native Bun WebSocket support with per-route handlers
- **Dual runtime** — same API works on Bun (`Bun.serve`) and Cloudflare Workers (`fetch`)
- **Typed Context** — `c.params`, `c.query`, `c.req`, `c.json()`, `c.text()`, `c.status()`, and more
- **Custom error/404 handlers** — `app.notFound()` and `app.onError()` for full control

## API Overview

```ts
// Routes
app.get(path, handler);
app.post(path, handler);
app.put(path, handler);
app.delete(path, handler);
app.patch(path, handler);
app.head(path, handler);
app.options(path, handler);
app.route(method, path, handler);

// WebSocket
app.ws(path, { open, message, close, drain });

// Middleware
app.use(middleware);

// Error handling
app.notFound(handler);
app.onError((error, c) => Response);

// Environment
app.setEnv(store);

// Start server
app.listen({ port: 3000 });
```

## License

MIT — see the [LICENSE](LICENSE) file for details.
