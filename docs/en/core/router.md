# Router — Radix Tree Routing

Box uses a **radix tree** (Patricia trie) for route matching — a compressed prefix tree that gives O(path_length) lookups with minimal memory overhead.

## Route Patterns

```ts
// Static — exact match
app.get("/users/list", handler);

// Dynamic — single segment captured as params
app.get("/user/:id", (c) => {
  c.params.id; // "42"
});

// Wildcard — captures remaining path
app.get("/static/*", (c) => {
  c.params["*"]; // "js/app.js"
});
```

## How the Radix Tree Works

The router compresses common URL prefixes into shared nodes:

```text
/users          → /users node
/users/:id      → /users → /:id       (compressed: /users/)
/users/:id/posts → /users → /:id → /posts
```

This means:
- **Fast lookups** — O(path_length), no regex backtracking
- **Low memory** — common prefixes are stored once
- **Method isolation** — separate tree per HTTP method

## Method Isolation

Each HTTP method has its own radix tree. The same path can have different handlers per method:

```ts
app.get("/item", getItem);
app.post("/item", createItem);
app.put("/item", updateItem);
app.delete("/item", deleteItem);
```

## Lookup Process

When a request arrives:

1. Extract method and path from the request
2. Select the radix tree for the method
3. Walk the tree matching segments:
   - Try **static** children first (exact prefix match)
   - Try **dynamic** `:param` child (captures segment value)
   - Try **wildcard** `*` child (captures remaining path)
4. Return `{ handler, params }` or `null` if no match

## Route Priority

Static routes take priority over dynamic ones. If both match at the same depth, the static route wins:

```ts
app.get("/version", (c) => c.text("1.0"));   // Static — wins
app.get("/:slug", (c) => c.text("Dynamic"));  // Dynamic
```

Request to `/version` → matches the static route.  
Request to `/anything-else` → matches the dynamic route.

## Performance

The radix tree router is highly optimized:

- **~2M req/s** for static routes (vs Hono: ~3M req/s)
- **~1.6M req/s** for parameterized routes (vs Hono: ~2M req/s)

See [Benchmarking](../advanced/benchmarking.md) for detailed comparisons.

---

> 📚 [Back to Index](../index.md) · [Previous: Context](context.md) · [Next: Middleware](middleware.md)
