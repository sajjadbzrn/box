# Getting Started with Box

## Installation

### Scaffold a new project (recommended)

```bash
bunx create-boxfw
```

Follow the interactive prompts. It will ask you about:
- **Runtime** — Bun, Cloudflare Workers, or both
- **ORM** — Include Drizzle or not
- **i18n** — Internationalization support
- **Auth** — JWT + Session authentication
- **Logger** — Structured request logging

Then:

```bash
cd my-project
bun install
bun run dev
```

### Manual installation

```bash
mkdir my-app && cd my-app
bun init -y
bun add boxfw-core
```

## Quick Start

```ts
import { Box } from "boxfw-core";

const app = new Box();

app.get("/", (c) => {
  return c.json({ message: "Hello, Box!" });
});

app.get("/user/:id", (c) => {
  return c.json({ id: c.params.id });
});

app.listen({ port: 3000 });
console.log("Server running at http://localhost:3000");
```

## Project Structure

A typical Box project looks like:

```
my-app/
├── src/
│   ├── index.ts          # Entry point
│   └── worker-entry.ts   # CF Worker entry (if applicable)
├── drizzle/
│   └── schema.ts         # Drizzle schema (if using ORM)
├── locales/
│   ├── en.json           # English translations (if using i18n)
│   └── fa.json           # Persian translations (if using i18n)
├── package.json
└── tsconfig.json
```

## Next Steps

| Topic | Documentation |
|-------|---------------|
| Core concepts | [App →](core/app.md) · [Context →](core/context.md) · [Router →](core/router.md) |
| Validation | [Validator package →](packages/validator.md) |
| Database | [DB package →](packages/db.md) |
| Authentication | [Auth package →](packages/auth.md) |
| Internationalization | [i18n package →](packages/i18n.md) |
| Logging | [Logger package →](packages/logger.md) |
| OpenAPI | [OpenAPI package →](packages/openapi.md) |
| WebSocket | [WebSocket guide →](guides/websocket.md) |
| Deployment | [Deployment guide →](guides/deployment.md) |
