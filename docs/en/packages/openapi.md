# OpenAPI — Spec Generation

The `boxfw-openapi` package auto-generates OpenAPI 3.0 specifications from your route definitions — no code generation step required.

## Installation

```bash
bun add boxfw-openapi
```

## Quick Start

```ts
import { Box } from "boxfw-core";
import { openapi } from "boxfw-openapi";

const app = new Box();

app.get("/users", (c) => c.json([]));
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json(body, 201);
});

// Serve OpenAPI spec at /openapi.json
app.get("/openapi.json", openapi(
  { title: "My API", version: "1.0.0" },
  [
    { method: "GET", path: "/users", summary: "List users", tags: ["Users"] },
    {
      method: "POST", path: "/users", summary: "Create user",
      tags: ["Users"], body: { name: "User's name", email: "Email" },
    },
  ],
));
```

## Route Spec

```ts
interface RouteSpec {
  method: string;                // "GET", "POST", etc.
  path: string;                   // "/user/:id" → converted to "/user/{id}"
  params?: Record<string, string>; // Path param descriptions
  query?: Record<string, string>;  // Query param descriptions
  body?: Record<string, string>;   // Request body descriptions
  summary?: string;
  tags?: string[];
}
```

Path parameters (`:id`) are automatically converted to OpenAPI format (`{id}`).

## Zod to OpenAPI

```ts
import { z } from "zod";
import { zodToOpenApi } from "boxfw-openapi";

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
});

const props = zodToOpenApi(userSchema);
// { name: { type: "string" }, email: { type: "string" }, age: { type: "number" } }
```

## API

| Function | Description |
|----------|-------------|
| `openapi(info, routes)` | Returns handler serving OpenAPI 3.0 JSON |
| `zodToOpenApi(schema)` | Extract OpenAPI properties from Zod schema |

---

> 📚 [Back to Index](../index.md) · [Previous: i18n](i18n.md) · [Next: Logger](logger.md)
