# Box Validator — Phase 1

Schema-based request validation with full TypeScript type inference, powered by Zod.

## Installation

```bash
bun add box-validator zod
```

## Quick start

```ts
import { Box } from "box-core";
import { v } from "box-validator";
import { z } from "zod";

const app = new Box();

// Params validation
app.get("/user/:id", v({
  params: z.object({ id: z.string() }),
}, (c) => {
  // c.validated.params.id → string (inferred)
  return c.json({ id: c.validated.params.id });
}));

// Query validation with coercion
app.get("/search", v({
  query: z.object({
    q: z.string().optional(),
    page: z.coerce.number().default(1),
  }),
}, (c) => {
  const page: number = c.validated.query.page;
  const q: string | undefined = c.validated.query.q;
  return c.json({ q, page });
}));

// Body validation
app.post("/user", v({
  body: z.object({ name: z.string(), email: z.string().email() }),
}, async (c) => {
  const { name, email } = c.validated.body;
  return c.json({ name, email }, 201);
}));

// Combined: params + body
app.put("/user/:id", v({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ name: z.string().optional() }),
}, (c) => {
  const { id } = c.validated.params;
  const { name } = c.validated.body;
  return c.json({ id, name });
}));

// Header validation
app.get("/admin", v({
  headers: z.object({ "x-api-key": z.string() }),
}, (c) => {
  return c.json({ key: c.validated.headers["x-api-key"] });
}));
```

## The `v()` API

`v(schemas, handler)` returns a function `(c: Context) => Promise<Response>` that:

1. Validates `params`, `query`, `body`, and `headers` against the provided schemas
2. On failure: returns a 400 JSON response with structured error details
3. On success: injects `c.validated` into the context and calls the handler

```ts
function v<S extends SchemaDef>(
  schemas: S,
  handler: (c: ValidatedContext<S>) => Response | Promise<Response>
): Handler
```

### `SchemaDef`

```ts
interface SchemaDef {
  params?: z.ZodType;    // Route path params (e.g. /:id)
  query?: z.ZodType;     // Query string params
  body?: z.ZodType;      // Request body (parsed as JSON)
  headers?: z.ZodType;   // Request headers
}
```

### `ValidatedContext<S>`

```ts
type ValidatedContext<S extends SchemaDef> = Context & {
  validated: {
    params:  // z.infer<S["params"]> or Record<string, string>
    query:   // z.infer<S["query"]> or Record<string, string>
    body:    // z.infer<S["body"]> or unknown
    headers: // z.infer<S["headers"]> or Record<string, string>
  };
};
```

Only schemas you include get their typed versions. Omitted schemas fall back to sensible defaults.

## Validation errors

When validation fails, Box returns:

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

HTTP status is always `400`.

## Type safety

Box's `v()` uses the schema as the single source of truth for types. The handler receives `c.validated` fully typed without any manual annotation:

```ts
v({ body: z.object({ name: z.string(), age: z.number() }) }, (c) => {
  c.validated.body.name.toUpperCase();  // ✅ string
  c.validated.body.age.toFixed(2);      // ✅ number
  c.validated.body.email;               // ❌ compile error (doesn't exist)
  //      ^-- Property 'email' does not exist
});
```

## How it works

`v()` is a higher-order function that wraps your handler with validation logic. It returns a plain `Handler`, so it slots directly into `.get()`, `.post()`, etc. — no special route methods needed.

The type inference boundary is between the schema object and the handler callback inside the same `v()` call, so TypeScript can flow the Zod-inferred types directly into the handler parameters.
