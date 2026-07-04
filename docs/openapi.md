# Box OpenAPI — Phase 6

Auto-generate OpenAPI 3.0 specs from your route definitions.

## Installation

```bash
bun add box-openapi
```

## Quick start

```ts
import { Box } from "box-core";
import { openapi } from "box-openapi";

const app = new Box();

// Your routes
app.get("/users", (c) => c.json([]));
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json(body, 201);
});

// Auto-generated OpenAPI spec
app.get("/openapi.json", openapi({
  title: "My API",
  version: "1.0.0",
  description: "A Box-powered API",
}, [
  { method: "GET", path: "/users", summary: "List users", tags: ["Users"] },
  {
    method: "POST",
    path: "/users",
    summary: "Create user",
    tags: ["Users"],
    body: { name: "User's name", email: "Email address" },
  },
]));

app.listen({ port: 3000 });
```

## API Reference

### `openapi(info, routes)`

Returns a handler that serves the OpenAPI 3.0 spec as JSON.

**`info`** — `OpenApiInfo`:
```ts
interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
}
```

**`routes`** — `RouteSpec[]`:
```ts
interface RouteSpec {
  method: string;               // "GET", "POST", etc.
  path: string;                  // "/user/:id" → converted to "/user/{id}"
  params?: Record<string, string>;   // Path param descriptions
  query?: Record<string, string>;    // Query param descriptions
  body?: Record<string, string>;     // Request body field descriptions
  summary?: string;
  tags?: string[];
}
```

### `zodToOpenApi(schema)`

Extract OpenAPI property definitions from a Zod schema's `.shape`.

```ts
import { z } from "zod";
import { zodToOpenApi } from "box-openapi";

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
});

const props = zodToOpenApi(userSchema);
// { name: { type: "string" }, email: { type: "string" }, age: { type: "number" } }
```

## Roadmap

- Full Zod schema → OpenAPI schema inference (mapping `z.string().min(3)` → `{ type: "string", minLength: 3 }`)
- Automatic route discovery from `Box` app instance
- Swagger UI integration
