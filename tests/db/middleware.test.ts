import { describe, it, expect } from "bun:test";
import { D, createDbCtx } from "../../packages/db/src/index";

describe("D() middleware", () => {
  it("injects the client into c.__db so c.db is accessible", async () => {
    const mockDb = { select: () => ({ from: () => [] }) };
    const mw = D(mockDb);

    let capturedDb: unknown = null;

    const nextCalled = { called: false };
    const fakeNext = async () => {
      nextCalled.called = true;
      return new Response("ok");
    };

    // Simulate middleware execution
    const ctx: Record<string, unknown> = {};
    await mw(ctx as any, fakeNext);

    expect(ctx.__db).toBe(mockDb);
    expect(nextCalled.called).toBe(true);
  });

  it("works with factory function for per-request client creation", async () => {
    let factoryCallCount = 0;
    const mw = D((_c: any) => {
      factoryCallCount++;
      return { query: () => "factory-db" };
    });

    const ctx: Record<string, unknown> = {
      env: (_key: string) => "test-binding",
    };

    await mw(ctx as any, async () => new Response("ok"));

    expect(factoryCallCount).toBe(1);
    expect(ctx.__db).toEqual({ query: expect.any(Function) });
  });

  it("factory receives the Context, enabling c.env() for D1 bindings", async () => {
    const envStore = { get: (k: string) => (k === "DB" ? "d1-binding" : undefined) };
    const ctx: Record<string, unknown> = {
      env: (_key: string) => envStore.get(_key),
    };

    let capturedEnv: unknown;
    const mw = D((c: any) => {
      capturedEnv = c.env("DB");
      return { prepared: capturedEnv };
    });

    await mw(ctx as any, async () => new Response("ok"));

    expect(capturedEnv).toBe("d1-binding");
    expect(ctx.__db).toEqual({ prepared: "d1-binding" });
  });

  it("c.db getter returns the injected client", () => {
    const mockDb = { find: () => "result" };
    const mw = D(mockDb);

    const ctx: Record<string, unknown> = {};

    // Define a db getter to simulate the Context class
    Object.defineProperty(ctx, "db", {
      get() { return (this as Record<string, unknown>).__db; },
    });

    mw(ctx as any, async () => new Response("ok"));

    expect((ctx as any).db).toBe(mockDb);
  });
});

describe("createDbCtx() typed accessor", () => {
  it("returns a function that extracts __db from context", () => {
    type MockDb = { query: (sql: string) => unknown[] };
    const db = createDbCtx<MockDb>();

    const mockClient: MockDb = { query: () => [] };
    const ctx = { __db: mockClient } as any;

    const result = db(ctx);
    expect(result).toBe(mockClient);
    expect(result.query("SELECT 1")).toEqual([]);
  });
});
