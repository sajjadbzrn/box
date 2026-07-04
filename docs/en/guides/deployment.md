# Deployment

Box runs on **Bun** and **Cloudflare Workers**. The same codebase deploys to either runtime with minimal changes.

## Deploying to Bun

### Development

```bash
bun run --watch src/index.ts
```

### Production

```bash
# Start the server
bun run src/index.ts

# Or use a process manager
bun pm start src/index.ts
```

### Docker

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

```bash
docker build -t my-box-app .
docker run -p 3000:3000 my-box-app
```

### Environment Variables

```bash
PORT=3000 JWT_SECRET=my-secret DATABASE_URL=file:./app.db bun run src/index.ts
```

## Deploying to Cloudflare Workers

### Worker Entry Point

```ts
// src/worker-entry.ts
import { Box } from "boxfw-core";
import { workerEnv } from "boxfw-adapters";

const app = new Box();
// ... routes and middleware ...

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
```

### Local Development

```bash
# Install wrangler
bun add -d wrangler

# Run locally
npx wrangler dev --local src/worker-entry.ts
```

### Deploy

```bash
npx wrangler deploy src/worker-entry.ts --name my-box-app
```

### Wrangler Configuration

```toml
# wrangler.toml
name = "my-box-app"
main = "src/worker-entry.ts"
compatibility_date = "2026-07-01"

# Bindings
[vars]
NODE_ENV = "production"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "my-db"
database_id = "your-database-id"
```

## Dual Runtime

Deploy the **same routes** to both runtimes:

```text
src/
├── index.ts          # Bun entry: app.listen({ port: 3000 })
└── worker-entry.ts   # Worker entry: export default { fetch }
```

Shared code:

```ts
// shared.ts
import { Box } from "boxfw-core";

export function createApp() {
  const app = new Box();
  app.get("/", (c) => c.json({ runtime: "cross-platform" }));
  return app;
}
```

```ts
// index.ts — Bun
import { createApp } from "./shared";
createApp().listen({ port: 3000 });
```

```ts
// worker-entry.ts — Cloudflare
import { createApp } from "./shared";
export default { fetch: (req, env) => createApp().fetch(req) };
```

## Production Considerations

| Concern | Recommendation |
|---------|---------------|
| **Secrets** | Use env vars (`c.env("SECRET")`) — never hardcode |
| **Database** | Use `boxfw-db` with Drizzle migrations |
| **Logging** | Use `boxfw-logger` with JSON format for log aggregation |
| **Sessions** | Replace `memoryStore()` with Redis/DB-backed store |
| **Rate limiting** | Implement as middleware using `c.store` |
| **CORS** | Create a simple middleware for CORS headers |

---

> 📚 [Back to Index](../index.md) · [Previous: Testing](testing.md) · [Next: Architecture](../advanced/architecture.md)
