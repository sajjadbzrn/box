import { describe, expect, it } from "bun:test";
import { Context } from "../../packages/core/src/context";
import { compose } from "../../packages/core/src/middleware";

function makeCtx(path = "/"): Context {
  return new Context(new Request(`http://localhost:3000${path}`));
}

describe("compose — onion middleware", () => {
  it("passes through to final handler when no middleware", async () => {
    const ctx = makeCtx();
    const handler = (_c: Context) => new Response("ok");
    const pipeline = compose([]);

    const res = await pipeline(ctx, handler);
    const text = await res.text();
    expect(text).toBe("ok");
  });

  it("executes a single middleware that calls next", async () => {
    const ctx = makeCtx();
    const order: string[] = [];

    const mw = async (_c: Context, next: () => Promise<Response>) => {
      order.push("mw-before");
      const res = await next();
      order.push("mw-after");
      return res;
    };

    const handler = (_c: Context) => {
      order.push("handler");
      return new Response("done");
    };

    const pipeline = compose([mw]);
    const res = await pipeline(ctx, handler);
    const text = await res.text();

    expect(text).toBe("done");
    expect(order).toEqual(["mw-before", "handler", "mw-after"]);
  });

  it("executes multiple middleware in onion order", async () => {
    const ctx = makeCtx();
    const order: string[] = [];

    const mw1 = async (_c: Context, next: () => Promise<Response>) => {
      order.push("1-before");
      const res = await next();
      order.push("1-after");
      return res;
    };

    const mw2 = async (_c: Context, next: () => Promise<Response>) => {
      order.push("2-before");
      const res = await next();
      order.push("2-after");
      return res;
    };

    const handler = (_c: Context) => {
      order.push("handler");
      return new Response("ok");
    };

    const pipeline = compose([mw1, mw2]);
    await pipeline(ctx, handler);

    expect(order).toEqual(["1-before", "2-before", "handler", "2-after", "1-after"]);
  });

  it("middleware can short-circuit without calling next", async () => {
    const ctx = makeCtx();
    const handlerCalled = { called: false };

    const mw = async (_c: Context, _next: () => Promise<Response>) => {
      return new Response("short-circuit", { status: 401 });
    };

    const handler = (_c: Context) => {
      handlerCalled.called = true;
      return new Response("ok");
    };

    const pipeline = compose([mw]);
    const res = await pipeline(ctx, handler);

    expect(res.status).toBe(401);
    expect(handlerCalled.called).toBe(false);
  });

  it("middleware can modify response headers", async () => {
    const ctx = makeCtx();

    const mw = async (c: Context, next: () => Promise<Response>) => {
      c.header("X-Middleware", "applied");
      return next();
    };

    const handler = (c: Context) => c.json({ ok: true });

    const pipeline = compose([mw]);
    const res = await pipeline(ctx, handler);

    expect(res.headers.get("X-Middleware")).toBe("applied");
  });

  it("throws if next() is called multiple times in same middleware", async () => {
    const ctx = makeCtx();

    const mw = async (_c: Context, next: () => Promise<Response>) => {
      await next();
      await next(); // <-- second call should fail
      return new Response("ok");
    };

    const handler = (_c: Context) => new Response("ok");
    const pipeline = compose([mw]);

    await expect(pipeline(ctx, handler)).rejects.toThrow("next() called multiple times");
  });

  it("handles errors from handler propagating through middleware", async () => {
    const ctx = makeCtx();

    const handler = (_c: Context): Response => {
      throw new Error("boom");
    };

    const pipeline = compose([]);
    await expect(pipeline(ctx, handler)).rejects.toThrow("boom");
  });

  it("middleware receives the same context object", async () => {
    const ctx = makeCtx();
    let capturedCtx: Context | null = null;

    const mw = async (c: Context, next: () => Promise<Response>) => {
      capturedCtx = c;
      return next();
    };

    const handler = (_c: Context) => new Response("ok");
    const pipeline = compose([mw]);
    await pipeline(ctx, handler);

    expect(capturedCtx).toBe(ctx);
  });
});
