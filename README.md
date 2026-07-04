# Box Framework

The opinionated, batteries-included backend framework for solo/indie developers shipping full-stack TypeScript apps to the edge.

```bash
bunx create-boxfw
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

| Language | Link |
|----------|------|
| English (EN) | [📖 docs/en/index.md](docs/en/index.md) |
| Persian (FA) | [📖 docs/fa/index.md](docs/fa/index.md) |

### Quick Navigation

| Section | Description |
|---------|-------------|
| [Getting Started](docs/en/getting-started.md) | Installation, setup, quick start |
| [Core Concepts](docs/en/core/app.md) | App, Context, Router, Middleware |
| [Packages](docs/en/packages/validator.md) | Validator, DB, Auth, i18n, Logger, OpenAPI |
| [Guides](docs/en/guides/websocket.md) | WebSocket, Error Handling, Testing, Deployment |
| [Advanced](docs/en/advanced/architecture.md) | Architecture, Benchmarking |

---

## Packages

| Package | Description | Docs |
|---------|-------------|------|
| [boxfw-core](packages/core) | Router, Context, middleware, WebSocket | [📖](docs/en/core/app.md) |
| [boxfw-validator](packages/validator) | Zod validation + type inference | [📖](docs/en/packages/validator.md) |
| [boxfw-adapters](packages/adapters) | Bun + Cloudflare Workers runtime | [📖](docs/en/packages/adapters.md) |
| [boxfw-db](packages/db) | Drizzle ORM integration | [📖](docs/en/packages/db.md) |
| [boxfw-auth](packages/auth) | JWT + session authentication | [📖](docs/en/packages/auth.md) |
| [boxfw-i18n](packages/i18n) | Locale detection + RTL + bilingual | [📖](docs/en/packages/i18n.md) |
| [boxfw-openapi](packages/openapi) | OpenAPI 3.0 spec generator | [📖](docs/en/packages/openapi.md) |
| [boxfw-logger](packages/logger) | Structured logging (pretty + JSON) | [📖](docs/en/packages/logger.md) |
| [create-boxfw](packages/create-box) | Project scaffolding CLI | [📖](docs/en/getting-started.md) |

---

## Quick start

```bash
# Scaffold a new project (recommended)
bunx create-boxfw

# Or add to an existing project
bun add boxfw-core boxfw-validator
```

```ts
import { Box } from "boxfw-core";
import { v } from "boxfw-validator";
import { z } from "zod";

const app = new Box();

app.get("/user/:id", v({
  params: z.object({ id: z.string() }),
}, (c) => {
  return c.json({ id: c.validated.params.id });
}));

app.listen({ port: 3000 });
```

## Features

- **Radix-tree router** — static, dynamic (`:id`), wildcard (`*`) routes
- **TypeScript-first** — end-to-end type inference from Zod schemas
- **Dual runtime** — same code on Bun and Cloudflare Workers
- **Onion middleware** — composable, fully typed
- **Drizzle ORM** — first-class integration with migration runner
- **i18n/RTL** — locale detection, bilingual errors, RTL metadata
- **Auth** — JWT (Web Crypto) + cookie-based sessions
- **OpenAPI** — auto-generate spec from route definitions
- **WebSocket** — native Bun WebSocket support
- **Structured Logger** — pretty console + JSON output, request logging
- **Zero-cost** when unused — tree-shakeable modules

## License

MIT
