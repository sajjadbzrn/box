# Validator — Request Validation

The `boxfw-validator` package provides Zod-based request validation with full TypeScript type inference. It wraps your handler and validates `params`, `query`, `body`, and `headers` against Zod schemas.

## Installation

```bash
bun add boxfw-validator zod
```

## Quick Start

```ts
import { Box } from "boxfw-core";
import { v } from "boxfw-validator";
import { z } from "zod";

const app = new Box();

app.get(
  "/user/:id",
  v(
    { params: z.object({ id: z.string() }) },
    (c) => {
      // c.validated.params.id → string (inferred)
      return c.json({ id: c.validated.params.id });
    },
  ),
);
```

## Schema Locations

```ts
v({
  params:  z.object({ ... }),   // Route parameters — /:id
  query:   z.object({ ... }),   // Query string — ?page=1
  body:    z.object({ ... }),   // Request body (JSON parsed)
  headers: z.object({ ... }),   // Request headers
}, handler);
```

Only the schemas you provide are validated. Omitted schemas pass through with sensible defaults.

## Full Example

```ts
app.post(
  "/user/:id",
  v(
    {
      params:  z.object({ id: z.string().uuid() }),
      query:   z.object({ format: z.enum(["json", "xml"]).optional() }),
      body:    z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
      headers: z.object({ "x-api-key": z.string() }),
    },
    (c) => {
      const { id } = c.validated.params;
      const { format } = c.validated.query;
      const { name, email } = c.validated.body;
      const apiKey = c.validated.headers["x-api-key"];
      return c.json({ id, name, email, format, apiKey });
    },
  ),
);
```

## Type Inference

The handler receives `c.validated` fully typed without manual annotations:

```ts
v({ body: z.object({ name: z.string(), age: z.number() }) }, (c) => {
  c.validated.body.name.toUpperCase();  // ✅ typed as string
  c.validated.body.age.toFixed(2);      // ✅ typed as number
  c.validated.body.email;               // ❌ compile error
});
```

## Validation Errors

On failure, returns a 400 JSON response:

```json
{
  "error": "Invalid params",
  "issues": [
    {
      "path": ["params", "id"],
      "message": "Expected string, received number",
      "code": "invalid_type"
    }
  ]
}
```

## API

| Function | Description |
|----------|-------------|
| `v(schemas, handler)` | Validates request and calls handler with typed `c.validated` |

---

> 📚 [Back to Index](../index.md) · [Previous: Middleware](../core/middleware.md) · [Next: Adapters](adapters.md)
