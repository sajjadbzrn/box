# Box Core — Phase 0

The core engine of the Box framework: radix-tree router, typed `Context`, onion-model middleware, and the `App` entry point.

## Installation

```bash
bun add box-core
```

## Quick start

```ts
import { Box } from "box-core";

const app = new Box();

// Static route
app.get("/", (c) => c.text("Hello, Box!"));

// Dynamic route with params
app.get("/user/:id", (c) => c.json({ id: c.params.id }));

// Query string parsing
app.get("/search", (c) => {
  const q = c.queryParam("q");
  return c.json({ query: q });
});

// POST with body
app.post("/echo", async (c) => {
  const body = await c.json();
  return c.json({ echoed: body }, 201);
});

// Wildcard route
app.get("/static/*", (c) => c.text(`Serving: ${c.params["*"]}`));

// Global middleware (onion model)
app.use(async (c, next) => {
  const start = Date.now();
  const res = await next();
  console.log(`${c.method} ${c.path} — ${Date.now() - start}ms`);
  return res;
});

// Start the server
app.listen({ port: 3000 });
```

## Router

The router uses a **radix tree** (Patricia trie) for fast route matching.

### Supported patterns

| Pattern | Example | Behavior |
|---------|---------|----------|
| Static | `/users/list` | Exact match |
| Dynamic | `/user/:id` | Captures single segment as `params.id` |
| Wildcard | `/files/*` | Captures remaining path as `params["*"]` |

### Method isolation

Routes are scoped to HTTP methods. The same path can have different handlers for `GET`, `POST`, `PUT`, etc.

```ts
app.get("/item", getHandler);
app.post("/item", createHandler);
app.put("/item", updateHandler);
app.delete("/item", deleteHandler);
```

## Context

Every handler and middleware receives a `Context` object:

```ts
interface Context {
  req: Request;              // Raw Web Request (use c.req.json() for body parsing)
  readonly method: string;   // HTTP method
  readonly path: string;     // URL path (no query string)
  params: Record<string, string>;  // Route params
  url: URL;                  // Parsed URL
  query: URLSearchParams;    // Query string params
  headers: Headers;          // Request headers
  store: Map<any>;           // Per-request scratchpad

  // Response builders
  status(code): this;
  header(name, value): this;
  json(data, status?): Response;
  text(data, status?): Response;
  html(data, status?): Response;
  redirect(url, status?): Response;

  // Convenience
  queryParam(name): string | null;
  headerValue(name): string | null;
}
```

### Body parsing

The raw `Request` object is available as `ctx.req`, so use standard Web APIs:

```ts
app.post("/user", async (c) => {
  const body = await c.req.json();
  return c.json({ received: body });
});
```

## Middleware

Middleware follows the **onion model**:

```ts
type Middleware = (c: Context, next: () => Promise<Response>) => Promise<Response>;
```

- Code **before** `await next()` runs on the way in (outer layer).
- Code **after** `await next()` runs on the way out (inner layer).
- Returning a `Response` directly **short-circuits** the chain (e.g., auth rejection).

```ts
// Logging middleware
app.use(async (c, next) => {
  const start = Date.now();
  const res = await next();
  console.log(`${c.method} ${c.path} ${res.status} ${Date.now() - start}ms`);
  return res;
});

// Auth middleware (short-circuits on failure)
app.use(async (c, next) => {
  const token = c.headerValue("authorization");
  if (!token) {
    return c.text("Unauthorized", 401);
  }
  return next();
});
```

## API Reference

### `new Box()`

Creates a new app instance.

### `.get(path, handler)` / `.post(path, handler)` / `.put(path, handler)` / `.delete(path, handler)` / `.patch(path, handler)` / `.head(path, handler)` / `.options(path, handler)`

Register a route for the given HTTP method.

### `.route(method, path, handler)`

Register a route with an arbitrary HTTP method string.

### `.use(middleware)`

Register global middleware. Executed in registration order.

### `.notFound(handler)`

Override the default 404 handler (which returns `"Not Found"`).

### `.onError(handler)`

Override the default error handler (which returns `"Internal Server Error"` with 500).

### `.listen(options?)`

Start the server via `Bun.serve()`. Passes through all Bun server options (`port`, `hostname`, `tls`, `development`, etc.).

### `.fetch(request)`

The core `fetch` handler — callable as a Cloudflare Worker entry point or standalone.
