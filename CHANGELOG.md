# Changelog

All notable changes to the **Box Framework** are documented here.

> **Format**: [Semantic Versioning](https://semver.org/) — this project follows
> `0.y.z` until a stable 1.0.0 release. Breaking changes are marked with ⚠️.

---

## [0.2.0] — 2026-07

### Added

- **`boxfw-logger` package** ([`b06dcb9`]) — structured logging with pretty console
  output (ANSI colors) and JSON format. Includes `createLogger()` for bare logging
  and `requestLogger()` middleware for automatic HTTP request/response logging.
  See [docs/en/packages/logger.md](docs/en/packages/logger.md).

- **Bilingual documentation** ([`40657ab`]) — full docs now available in both English
  (EN) and Persian (FA) under `docs/en/` and `docs/fa/`.

- **MIT License** ([`494d664`]) — project is now formally licensed under MIT.

- **`create-boxfw` scaffolding** now generates `^0.2.0` versions for all boxfw
  packages and includes a `boxfw:update` script to keep packages always at the
  latest version.

### Changed

- **`boxfw-core` fixes** ([`5f1d410`]) — internal fixes to the radix-tree router,
  context handling, and middleware pipeline.

- **Version bump** ([`cfc9d5e`]) — all packages bumped from `0.1.0` to `0.2.0`
  for consistency.

---

## [0.1.0] — 2026-07

Initial release of the Box Framework.

### Packages

| Package | Description |
|---------|-------------|
| **`boxfw-core`** | Radix-tree router, typed Context, onion-model middleware pipeline, WebSocket support |
| **`boxfw-validator`** | Zod-based request validation with full TypeScript type inference (`v()`) |
| **`boxfw-adapters`** | Dual-runtime adapters for Bun (`bunEnv`) and Cloudflare Workers (`workerEnv`) |
| **`boxfw-db`** | First-class Drizzle ORM integration with migration runner (`D()`, `createDbCtx()`, `migrate()`) |
| **`boxfw-auth`** | Pluggable authentication — JWT (HS256 via Web Crypto API) and cookie-based sessions |
| **`boxfw-i18n`** | Internationalization — locale detection (header/cookie/query), bilingual errors, RTL metadata |
| **`boxfw-openapi`** | OpenAPI 3.0 spec generator from route definitions |
| **`create-boxfw`** | Interactive project scaffolding CLI (`bunx create-boxfw`) |

### Core API

```ts
import { Box } from "boxfw-core";

const app = new Box();

// Route registration
app.get("/", (c) => c.text("Hello"));
app.post("/users", async (c) => c.json(await c.req.json(), 201));
app.get("/user/:id", (c) => c.json({ id: c.params.id }));

// Middleware (onion model)
app.use(async (c, next) => {
  const res = await next();
  res.headers.set("x-powered-by", "Box");
  return res;
});

// Custom error handlers
app.notFound((c) => c.json({ error: "Not Found" }, 404));
app.onError((err, c) => c.json({ error: err.message }, 500));

// WebSocket
app.ws("/chat", {
  open: (ws) => ws.send("Welcome!"),
  message: (ws, data) => ws.send(`Echo: ${data}`),
});

// Start server (Bun)
app.listen({ port: 3000 });
```

---

## Upgrade Guides

| From | To | Guide |
|------|----|-------|
| 0.1.0 | 0.2.0 | [docs/en/guides/upgrade.md](docs/en/guides/upgrade.md#-010--020) |

---

> **View the full documentation**: [docs/en/](docs/en/index.md)
