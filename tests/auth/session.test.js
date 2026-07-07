import { describe, it, expect } from "bun:test";
import { session, memoryStore } from "../../packages/auth/src/session";
describe("session middleware", () => {
    it("creates a new session when no cookie is present", async () => {
        const mw = session();
        const req = new Request("http://localhost:3000/");
        const ctx = { req };
        const res = await mw(ctx, async () => new Response("ok"));
        expect(ctx.session).toEqual({});
        expect(res.headers.get("set-cookie")).toContain("sid=");
    });
    it("sets session data on the context", async () => {
        const store = memoryStore();
        const mw = session({ store });
        const req = new Request("http://localhost:3000/login");
        const ctx = { req };
        const res = await mw(ctx, async () => {
            ctx.session = { userId: "42", role: "admin" };
            return new Response("ok");
        });
        // Session data should be on the context
        expect(ctx.session).toEqual({ userId: "42", role: "admin" });
        // Cookie should be set
        const cookie = res.headers.get("set-cookie") ?? "";
        expect(cookie).toContain("sid=");
    });
    it("continues without session in optional mode", async () => {
        const mw = session({ optional: true });
        const req = new Request("http://localhost:3000/public");
        const ctx = { req };
        let nextCalled = false;
        await mw(ctx, async () => {
            nextCalled = true;
            return new Response("ok");
        });
        expect(nextCalled).toBe(true);
        expect(ctx.session).toBeDefined();
    });
});
//# sourceMappingURL=session.test.js.map