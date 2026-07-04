# Box Auth — Phase 6

Pluggable authentication for Box: JWT and session-based.

## Installation

```bash
bun add box-auth
```

## JWT Authentication

Uses Web Crypto API — works identically on Bun and Cloudflare Workers.

```ts
import { Box } from "box-core";
import { jwt, signJwt } from "box-auth";

const app = new Box();

// Protect all routes
app.use(jwt({ secret: c.env("JWT_SECRET") ?? "dev-secret" }));

// Authenticated route
app.get("/me", (c) => {
  const user = c.jwt; // { sub, iat, exp, role, ... }
  return c.json({ user });
});

// Login endpoint
app.post("/login", async (c) => {
  const { username, password } = await c.req.json();
  // Verify credentials...
  const token = await signJwt({ sub: username, role: "user" }, secret, 3600);
  return c.json({ token });
});
```

### `jwt(options)` middleware

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `secret` | `string` | required | HMAC secret key |
| `cookie` | `string` | — | Cookie name to read token from |
| `optional` | `boolean` | `false` | If true, missing tokens don't 401 |

### `signJwt(payload, secret, expiresInSeconds?)`

Creates a signed JWT (HS256) using Web Crypto API.

```ts
const token = await signJwt({ sub: "user-42", role: "admin" }, secret, 7200);
```

## Session Authentication

Cookie-based sessions with pluggable storage.

```ts
import { session, memoryStore } from "box-auth";

// In-memory sessions (dev / single-process)
app.use(session());

// Custom store (Redis, DB, etc.)
app.use(session({ store: redisStore, ttl: 3600 }));

app.post("/login", async (c) => {
  // Verify credentials...
  c.session.userId = "42";
  c.session.role = "admin";
  return c.json({ ok: true });
});

app.get("/me", (c) => {
  return c.json({ userId: c.session.userId });
});
```

### `session(options)` middleware

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cookieName` | `string` | `"sid"` | Session cookie name |
| `ttl` | `number` | `86400` | Session TTL in seconds (24h) |
| `store` | `SessionStore` | `memoryStore()` | Custom session store |
| `optional` | `boolean` | `false` | If true, continues without session |

### `memoryStore()`

Returns an in-memory `SessionStore` for development.

### `SessionStore` interface

```ts
interface SessionStore {
  get(sid: string): Promise<Record<string, unknown> | null>;
  set(sid: string, data: Record<string, unknown>, ttl: number): Promise<void>;
  del(sid: string): Promise<void>;
}
```

Implement this for Redis, PostgreSQL, D1, or any persistent storage.
