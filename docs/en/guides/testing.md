# Testing

Box apps are tested with **Bun's built-in test runner**. Tests use the standard Web `Request`/`Response` APIs, making them fast and dependency-free.

## Setting Up Tests

Tests are in the `tests/` directory and use `bun:test`:

```ts
// tests/app.test.ts
import { describe, it, expect } from "bun:test";
import { Context } from "boxfw-core";
```

Run all tests:

```bash
bun test
```

Run specific test file:

```bash
bun test tests/app.test.ts
```

## Testing Context

```ts
import { describe, it, expect } from "bun:test";
import { Context } from "boxfw-core";

function makeCtx(path = "/", init?: RequestInit): Context {
  return new Context(
    new Request(`http://localhost:3000${path}`, init),
    {},
  );
}

describe("Context", () => {
  it("parses query parameters", () => {
    const ctx = makeCtx("/api/users?page=2");
    expect(ctx.queryParam("page")).toBe("2");
  });

  it("returns JSON responses", () => {
    const ctx = makeCtx("/");
    const res = ctx.json({ ok: true });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
```

## Testing Middleware

```ts
import { describe, it, expect } from "bun:test";
import { compose } from "boxfw-core";

describe("Middleware", () => {
  it("executes in onion order", async () => {
    const order: string[] = [];

    const mw1 = async (_c: any, next: () => Promise<Response>) => {
      order.push("1-before");
      const res = await next();
      order.push("1-after");
      return res;
    };

    const pipeline = compose([mw1]);
    // ...
  });
});
```

## Testing Handlers

```ts
import { describe, it, expect } from "bun:test";
import { Box } from "boxfw-core";

describe("Routes", () => {
  it("GET / returns hello", async () => {
    const app = new Box();
    app.get("/", (c) => c.text("Hello!"));

    const res = await app.fetch(new Request("http://localhost:3000/"));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toBe("Hello!");
  });

  it("POST /users creates a user", async () => {
    const app = new Box();
    app.post("/users", async (c) => {
      const body = await c.req.json();
      return c.json({ created: body }, 201);
    });

    const res = await app.fetch(
      new Request("http://localhost:3000/users", {
        method: "POST",
        body: JSON.stringify({ name: "Box" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(res.status).toBe(201);
  });
});
```

## Testing Validation

```ts
import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { v } from "boxfw-validator";

describe("Validation", () => {
  it("rejects invalid input", async () => {
    const handler = v(
      { params: z.object({ id: z.string() }) },
      (c) => c.json(c.validated.params),
    );

    const { Context } = await import("boxfw-core");
    const ctx = new Context(
      new Request("http://localhost:3000/user/"),
      { id: "" },
    );

    const res = await handler(ctx as any);
    expect(res.status).toBe(400);
  });
});
```

## Testing Logs

Use a custom stream to capture logger output:

```ts
function captureStream(): {
  stream: { write: (text: string) => void };
  lines: string[];
} {
  const lines: string[] = [];
  return {
    stream: { write: (text: string) => lines.push(text) },
    lines,
  };
}

it("captures log output", () => {
  const { stream, lines } = captureStream();
  const log = createLogger({ stream, level: "info", colors: false });

  log.info("test message");

  expect(lines[0]).toContain("test message");
});
```

## Best Practices

1. **Use `app.fetch()` directly** — no network overhead
2. **Create helper functions** like `makeCtx()` to reduce boilerplate
3. **Test middleware in isolation** with `compose()`
4. **Use `toBeDefined()` and `toBeNull()`** for optional values

---

> 📚 [Back to Index](../index.md) · [Previous: Error Handling](error-handling.md) · [Next: Deployment](deployment.md)
