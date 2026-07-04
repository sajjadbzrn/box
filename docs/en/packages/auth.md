# Auth — Authentication

The `boxfw-auth` package provides JWT (HS256) and cookie-based session authentication. Both work on Bun and Cloudflare Workers using the Web Crypto API.

## Installation

```bash
bun add boxfw-auth
```

## JWT Authentication

Uses Web Crypto API — no Node.js `crypto` dependency needed.

```ts
import { jwt, signJwt } from "boxfw-auth";

const app = new Box();

// Protect all routes with JWT
app.use(jwt({ secret: c.env("JWT_SECRET") ?? "dev-secret" }));

// Login endpoint
app.post("/login", async (c) => {
  const { username } = await c.req.json();
  const token = await signJwt(
    { sub: username, role: "user" },
    "dev-secret",
    3600, // 1 hour
  );
  return c.json({ token });
});

// Authenticated route
app.get("/me", (c) => {
  const user = c.jwt; // { sub, role, iat, exp }
  return c.json({ user });
});
```

### Optional JWT

```ts
app.use(jwt({ secret: "my-secret", optional: true }));
// c.jwt is null if no token present
```

### Cookie-Based JWT

```ts
app.use(jwt({ secret: "my-secret", cookie: "token" }));
// Reads token from cookie instead of Authorization header
```

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `secret` | `string` | required | HMAC secret key |
| `cookie` | `string` | — | Cookie name to read token from |
| `optional` | `boolean` | `false` | Skip auth if token missing |

### `signJwt(payload, secret, expiresInSeconds?)`

```ts
const token = await signJwt({ sub: "user-42", role: "admin" }, "secret", 7200);
// Returns HS256 JWT string
```

## Session Authentication

Cookie-based sessions with pluggable storage.

```ts
import { session, memoryStore } from "boxfw-auth";

// In-memory sessions (development)
app.use(session());

// Custom store (Redis, DB, etc.)
app.use(session({ store: redisStore, ttl: 3600 }));

app.post("/login", async (c) => {
  // Set session data
  c.session.userId = "42";
  c.session.role = "admin";
  return c.json({ ok: true });
});

app.get("/me", (c) => {
  return c.json({ userId: c.session.userId });
});
```

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cookieName` | `string` | `"sid"` | Session cookie name |
| `ttl` | `number` | `86400` | Session TTL in seconds (24h) |
| `store` | `SessionStore` | `memoryStore()` | Custom session store |
| `optional` | `boolean` | `false` | Continue without session |

### Session Store Interface

```ts
interface SessionStore {
  get(sid: string): Promise<Record<string, unknown> | null>;
  set(sid: string, data: Record<string, unknown>, ttl: number): Promise<void>;
  del(sid: string): Promise<void>;
}
```

Implement this for Redis, PostgreSQL, D1, or any database.

### Memory Store

`memoryStore()` is included for development. In production, implement a persistent store.

---

> 📚 [Back to Index](../index.md) · [Previous: DB](db.md) · [Next: i18n](i18n.md)
