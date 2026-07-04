# Box Framework

The opinionated, batteries-included backend framework for solo/indie developers shipping full-stack TypeScript apps to the edge.

```bash
bunx create-boxfw
```

## Packages

| Package | Description |
|---------|-------------|
| [boxfw-core](packages/core) | Router, Context, middleware, WebSocket |
| [boxfw-validator](packages/validator) | Zod validation + type inference |
| [boxfw-adapters](packages/adapters) | Bun + Cloudflare Workers runtime |
| [boxfw-db](packages/db) | Drizzle ORM integration |
| [boxfw-i18n](packages/i18n) | Locale detection + RTL + bilingual |
| [boxfw-auth](packages/auth) | JWT + session authentication |
| [boxfw-openapi](packages/openapi) | OpenAPI 3.0 spec generator |
| [create-boxfw](packages/create-box) | Project scaffolding CLI |

## Quick start

```bash
# Scaffold a new project
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
- **Zero-cost** when unused — tree-shakeable modules

## License

MIT
