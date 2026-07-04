# App — The Main Application Class

The `App` class (exported as `Box`) is the entry point of every Box application. It ties together the router, middleware pipeline, and HTTP server.

## Creating an App

```ts
import { Box } from "boxfw-core";

const app = new Box();
```

## Registering Routes

All HTTP methods are supported via chainable methods:

```ts
app.get("/users", listUsers);
app.post("/users", createUser);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);
app.patch("/users/:id", patchUser);
app.head("/health", healthCheck);
app.options("/cors", corsHandler);

// Generic method
app.route("PATCH", "/item/:id", handler);
```

## Route Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| Static | `/users/list` | Exact match |
| Dynamic | `/user/:id` | Captures single segment as `params.id` |
| Wildcard | `/files/*` | Captures remaining path as `params["*"]` |

## Middleware

Register global middleware with `.use()`:

```ts
app.use(async (c, next) => {
  const start = Date.now();
  const res = await next();
  console.log(`${c.method} ${c.path} — ${res.status} (${Date.now() - start}ms)`);
  return res;
});
```

Middleware executes in **onion order** — code before `await next()` runs on the way in, code after runs on the way out.

## WebSocket

Register WebSocket routes with `.ws()`:

```ts
app.ws("/chat", {
  open: (ws) => console.log("Connected"),
  message: (ws, data) => ws.send(`Echo: ${data}`),
  close: (ws) => console.log("Disconnected"),
});
```

## Error Handling

Override the default 404 and error handlers:

```ts
app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal Server Error" }, 500);
});
```

## Starting the Server

```ts
// Bun — full options passthrough
app.listen({ port: 3000, hostname: "0.0.0.0" });
app.listen({ port: 443, tls: { key: "...", cert: "..." } });

// Cloudflare Worker — use app.fetch() in your handler
export default {
  async fetch(request, env) {
    return app.fetch(request);
  },
};
```

## API

| Method | Description |
|--------|-------------|
| `get(path, handler)` | Register GET route |
| `post(path, handler)` | Register POST route |
| `put(path, handler)` | Register PUT route |
| `delete(path, handler)` | Register DELETE route |
| `patch(path, handler)` | Register PATCH route |
| `head(path, handler)` | Register HEAD route |
| `options(path, handler)` | Register OPTIONS route |
| `route(method, path, handler)` | Register any method |
| `ws(path, handlers)` | Register WebSocket route |
| `use(middleware)` | Add global middleware |
| `notFound(handler)` | Override 404 handler |
| `onError(handler)` | Override error handler |
| `setEnv(store)` | Set runtime env store |
| `fetch(request)` | Core fetch handler |
| `listen(options)` | Start Bun server |

---

> 📚 [Back to Index](../index.md) · [Next: Context →](context.md)
