# Context — The Request/Response Object

`Context` is the unified request/response object passed through the middleware chain and into route handlers. It provides typed access to the request, route params, query string, and response builders.

## Accessing Request Data

```ts
app.get("/user/:id", (c) => {
  // Route parameters
  c.params.id;           // string — from /:id

  // URL & query
  c.url;                 // URL object
  c.path;                // "/user/42"
  c.query;               // URLSearchParams
  c.queryParam("page");  // string | null

  // HTTP method
  c.method;              // "GET"

  // Headers
  c.headers;             // Headers object
  c.headerValue("accept"); // string | null

  // Raw request (for body parsing)
  c.req;                 // Request object
});
```

## Reading the Request Body

```ts
app.post("/users", async (c) => {
  // JSON body
  const body = await c.req.json();

  // Text body
  const text = await c.req.text();

  // Form data
  const form = await c.req.formData();

  return c.json({ received: body });
});
```

## Building Responses

```ts
// JSON response
c.json({ ok: true });                      // 200
c.json({ created: true }, 201);            // 201

// Text response
c.text("Hello, World!");                   // 200
c.text("Not Found", 404);                  // 404

// HTML response
c.html("<h1>Hello</h1>");                  // 200

// Redirect
c.redirect("/login");                      // 302
c.redirect("/permanent", 301);             // 301
```

## Fluent API

Methods return `this` for chaining:

```ts
c.status(201)
  .header("X-Custom", "value")
  .json({ data: "created" });
```

## Environment Variables

Access env vars or Cloudflare Worker bindings in a runtime-neutral way:

```ts
// Bun — reads from process.env
// Cloudflare Workers — reads from the env bindings
const dbUrl = c.env("DATABASE_URL");
const db = c.env<D1Database>("DB"); // typed bindings
```

## Per-Request Store

Attach arbitrary data accessible through the middleware chain:

```ts
// In middleware
app.use(async (c, next) => {
  c.store.set("requestId", crypto.randomUUID());
  return next();
});

// In handler
app.get("/", (c) => {
  const requestId = c.store.get("requestId");
  return c.json({ requestId });
});
```

## Context Properties

| Property | Type | Description |
|----------|------|-------------|
| `req` | `Request` | Raw incoming request |
| `params` | `Record<string, string>` | Route parameters |
| `url` | `URL` | Parsed URL |
| `method` | `string` | HTTP method |
| `path` | `string` | URL pathname |
| `query` | `URLSearchParams` | Query string |
| `headers` | `Headers` | Request headers |
| `store` | `Map` | Per-request scratchpad |
| `locale` | `string` | Detected locale (i18n) |
| `db` | `unknown` | Drizzle client (db middleware) |

## Response Methods

| Method | Description |
|--------|-------------|
| `status(code)` | Set HTTP status |
| `header(name, value)` | Set response header |
| `json(data, status?)` | JSON response |
| `text(data, status?)` | Plain text response |
| `html(data, status?)` | HTML response |
| `redirect(url, status?)` | Redirect (default 302) |
| `queryParam(name)` | Get query param |
| `headerValue(name)` | Get request header |
| `env(key)` | Read env variable/binding |

---

> 📚 [Back to Index](../index.md) · [Previous: App](app.md) · [Next: Router](router.md)
