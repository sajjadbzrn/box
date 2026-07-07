import { describe, it, expect } from "bun:test";
import { D, createDbCtx } from "../../packages/db/src/index";
describe("D() middleware", () => {
    it("injects the client into c.__db so c.db is accessible", async () => {
        const mockDb = { select: () => ({ from: () => [] }) };
        const mw = D(mockDb);
        let capturedDb = null;
        const nextCalled = { called: false };
        const fakeNext = async () => {
            nextCalled.called = true;
            return new Response("ok");
        };
        // Simulate middleware execution
        const ctx = {};
        await mw(ctx, fakeNext);
        expect(ctx.__db).toBe(mockDb);
        expect(nextCalled.called).toBe(true);
    });
    it("works with factory function for per-request client creation", async () => {
        let factoryCallCount = 0;
        const mw = D((_c) => {
            factoryCallCount++;
            return { query: () => "factory-db" };
        });
        const ctx = {
            env: (_key) => "test-binding",
        };
        await mw(ctx, async () => new Response("ok"));
        expect(factoryCallCount).toBe(1);
        expect(ctx.__db).toEqual({ query: expect.any(Function) });
    });
    it("factory receives the Context, enabling c.env() for D1 bindings", async () => {
        const envStore = { get: (k) => (k === "DB" ? "d1-binding" : undefined) };
        const ctx = {
            env: (_key) => envStore.get(_key),
        };
        let capturedEnv;
        const mw = D((c) => {
            capturedEnv = c.env("DB");
            return { prepared: capturedEnv };
        });
        await mw(ctx, async () => new Response("ok"));
        expect(capturedEnv).toBe("d1-binding");
        expect(ctx.__db).toEqual({ prepared: "d1-binding" });
    });
    it("c.db getter returns the injected client", () => {
        const mockDb = { find: () => "result" };
        const mw = D(mockDb);
        const ctx = {};
        // Define a db getter to simulate the Context class
        Object.defineProperty(ctx, "db", {
            get() { return this.__db; },
        });
        mw(ctx, async () => new Response("ok"));
        expect(ctx.db).toBe(mockDb);
    });
});
describe("createDbCtx() typed accessor", () => {
    it("returns a function that extracts __db from context", () => {
        const db = createDbCtx();
        const mockClient = { query: () => [] };
        const ctx = { __db: mockClient };
        const result = db(ctx);
        expect(result).toBe(mockClient);
        expect(result.query("SELECT 1")).toEqual([]);
    });
});
//# sourceMappingURL=middleware.test.js.map