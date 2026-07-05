# boxfw-auth

[![npm version](https://badge.fury.io/js/boxfw-auth.svg)](https://www.npmjs.com/package/boxfw-auth)

Pluggable **authentication** for **Box Framework** — JWT (HS256 via Web Crypto API) and cookie-based sessions.

## Installation

```bash
bun add boxfw-auth
```

> Requires `boxfw-core` as a peer dependency.

## Quick Start

### JWT

```ts
import { Box } from "boxfw-core";
import { jwt, signJwt } from "boxfw-auth";

const app = new Box();
app.use(jwt({ secret: "my-secret" }));

app.get("/me", (c) => {
  return c.json({ user: c.jwt });
});

// Sign a token
const token = await signJwt({ sub: "42", role: "admin" }, "my-secret", 3600);
```

### Sessions

```ts
import { Box } from "boxfw-core";
import { session } from "boxfw-auth";

const app = new Box();
app.use(session());

app.post("/login", async (c) => {
  c.session = { userId: "42", role: "admin" };
  return c.json({ ok: true });
});

app.get("/me", (c) => {
  return c.json({ user: c.session });
});
```

## Features

- **JWT middleware** — verifies HS256 tokens via Web Crypto API (works on Bun + Workers)
- **Cookie-based sessions** — automatic session creation, persistence, and cookie management
- **Optional mode** — `{ optional: true }` for public routes with optional auth
- **Pluggable session store** — default in-memory store; swap in Redis/DB stores
- **Zero dependencies** — no `jsonwebtoken` or `bcrypt` needed; uses Web Crypto API

## API

```ts
// JWT (reads from Authorization: Bearer or named cookie)
app.use(jwt({ secret: string, cookie?: string, optional?: boolean }));
c.jwt   // → decoded payload or null

// Sign a JWT
signJwt(payload, secret, expiresInSeconds?)

// Sessions (cookie-based)
app.use(session({ cookieName?: string, ttl?: number, store?: SessionStore, optional?: boolean }));
c.session   // → session data object
```

## License

MIT — see the [LICENSE](LICENSE) file for details.
