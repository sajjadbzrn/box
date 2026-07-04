import { describe, it, expect } from "bun:test";
import { App } from "../../packages/core/src/app";
import { Context } from "../../packages/core/src/context";
import type { EnvStore } from "../../packages/core/src/types";

function makeStore(values: Record<string, unknown>): EnvStore {
  return { get: (key) => values[key] };
}

describe("App — env integration", () => {
  it("injects env store into context so c.env() works in handlers", async () => {
    const app = new App();
    app.setEnv(makeStore({ APP_NAME: "BoxTest" }));

    let capturedEnv: string | undefined;

    app.get("/test", (c) => {
      capturedEnv = c.env("APP_NAME");
      return c.text("ok");
    });

    const req = new Request("http://localhost:3000/test");
    const res = await app.fetch(req);
    
    expect(res.status).toBe(200);
    expect(capturedEnv).toBe("BoxTest");
  });

  it("c.env() returns undefined for missing keys", async () => {
    const app = new App();
    app.setEnv(makeStore({}));

    let captured: unknown;

    app.get("/missing", (c) => {
      captured = c.env("NONEXISTENT");
      return c.text("ok");
    });

    const req = new Request("http://localhost:3000/missing");
    await app.fetch(req);
    
    expect(captured).toBeUndefined();
  });

  it("env store is available in middleware", async () => {
    const app = new App();
    app.setEnv(makeStore({ REGION: "us-east-1" }));

    let envInMiddleware: string | undefined;

    app.use(async (c, next) => {
      envInMiddleware = c.env("REGION");
      return next();
    });

    app.get("/mw", (c) => c.text("ok"));

    const req = new Request("http://localhost:3000/mw");
    await app.fetch(req);

    expect(envInMiddleware).toBe("us-east-1");
  });

  it("env passed to fetch() overrides app-level env", async () => {
    const app = new App();
    app.setEnv(makeStore({ KEY: "default" }));

    let seen: unknown;

    app.get("/override", (c) => {
      seen = c.env("KEY");
      return c.text("ok");
    });

    const req = new Request("http://localhost:3000/override");
    await app.fetch(req, makeStore({ KEY: "per-request" }));

    expect(seen).toBe("per-request");
  });

  it("fetch without setEnv still works (env returns undefined)", async () => {
    const app = new App();

    let envVal: unknown = "NOT_CALLED";

    app.get("/no-env", (c) => {
      envVal = c.env("ANYTHING");
      return c.text("ok");
    });

    const req = new Request("http://localhost:3000/no-env");
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
    expect(envVal).toBeUndefined();
  });

  it("404 handler also receives env", async () => {
    const app = new App();
    app.setEnv(makeStore({ NOT_FOUND_MSG: "custom 404" }));

    let envVal: unknown;

    app.notFound((c) => {
      envVal = c.env("NOT_FOUND_MSG");
      return c.text("not found", 404);
    });

    const req = new Request("http://localhost:3000/nope");
    await app.fetch(req);

    expect(envVal).toBe("custom 404");
  });
});

describe("Context — env() method", () => {
  it("env() works directly on Context with explicit env", () => {
    const store = makeStore({ TOKEN: "abc-123" });
    const req = new Request("http://localhost:3000/");
    const ctx = new Context(req, {}, store);

    expect(ctx.env("TOKEN")).toBe("abc-123");
    expect(ctx.env("MISSING")).toBeUndefined();
  });

  it("_setEnv can update env after construction", () => {
    const req = new Request("http://localhost:3000/");
    const ctx = new Context(req);

    // Before setting env
    expect(ctx.env("TOKEN")).toBeUndefined();

    // After setting env
    ctx._setEnv(makeStore({ TOKEN: "xyz-789" }));
    expect(ctx.env("TOKEN")).toBe("xyz-789");
  });

  it("env<T>() returns typed values", () => {
    const store = makeStore({ count: 42, name: "Box" });
    const req = new Request("http://localhost:3000/");
    const ctx = new Context(req, {}, store);

    const count = ctx.env<number>("count");
    const name = ctx.env<string>("name");

    expect(count).toBe(42);
    expect(name).toBe("Box");
  });
});
