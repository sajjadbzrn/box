# Middleware — Onion Model Pipeline

Middleware in Box follows the **onion model** — each middleware wraps the next, creating layers around the route handler.

## Signature

```ts
type Middleware = (
  c: Context,
  next: () => Promise<Response>,
) => Promise<Response>;
```

Every middleware **must** return a `Response`:
- Return `await next()` to pass through after decoration
- Return your own `Response` to short-circuit (e.g., auth rejection)

## Basic Middleware

```ts
// Logging middleware
app.use(async (c, next) => {
  const start = Date.now();
  const res = await next();
  console.log(`${c.method} ${c.path} ${res.status} ${Date.now() - start}ms`);
  return res;
});

// Header injection
app.use(async (c, next) => {
  c.header("X-Powered-By", "Box");
  return next();
});
```

## Short-Circuiting

Return a response directly to stop the chain:

```ts
app.use(async (c, next) => {
  const token = c.headerValue("authorization");
  if (!token) {
    return c.text("Unauthorized", 401);
  }
  return next();
});
```

The route handler will never be called.

## Onion Execution Order

Middleware is executed in the order it's registered. Each middleware has two phases:

```text
Request → Middleware 1 (before next)
               → Middleware 2 (before next)
                    → Route Handler
               → Middleware 2 (after next)
          → Middleware 1 (after next)
     → Response
```

Example:

```ts
app.use(async (c, next) => {
  console.log("1-before");
  const res = await next();
  console.log("1-after");
  return res;
});

app.use(async (c, next) => {
  console.log("2-before");
  const res = await next();
  console.log("2-after");
  return res;
});

app.get("/", (c) => {
  console.log("handler");
  return c.text("ok");
});

// Output:
// 1-before
// 2-before
// handler
// 2-after
// 1-after
```

## Composing Middleware

The `compose()` function powers the middleware pipeline internally:

```ts
import { compose } from "boxfw-core";

const pipeline = compose([middleware1, middleware2]);
const response = await pipeline(ctx, routeHandler);
```

## Best Practices

- **Register middleware before routes** — order matters
- **Use `c.store`** for passing data between middleware
- **Don't call `next()` twice** — it throws an error
- **Always return a Response** — either from `next()` or directly

## Built-in Middleware Packages

| Package | Middleware | Description |
|---------|-----------|-------------|
| `boxfw-validator` | `v(schemas, handler)` | Request validation |
| `boxfw-db` | `D(client)` | Drizzle ORM injection |
| `boxfw-auth` | `jwt(options)` | JWT authentication |
| `boxfw-auth` | `session(options)` | Session management |
| `boxfw-i18n` | `localeDetect(config)` | Locale detection |
| `boxfw-logger` | `requestLogger(options)` | Request logging |

---

> 📚 [Back to Index](../index.md) · [Previous: Router](router.md) · [Next: Validator](../packages/validator.md)
