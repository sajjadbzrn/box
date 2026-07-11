import { describe, expect, it } from "bun:test";
import { memoryStore, session } from "../../packages/auth/src/session";

describe("session middleware", () => {
  it("creates a new session when no cookie is present", async () => {
    const mw = session();

    const req = new Request("http://localhost:3000/");
    const ctx: Record<string, unknown> = { req };

    const res = await mw(ctx as any, async () => new Response("ok"));

    expect(ctx.session).toEqual({});
    expect(res.headers.get("set-cookie")).toContain("sid=");
  });

  it("sets session data on the context", async () => {
    const store = memoryStore();
    const mw = session({ store });

    const req = new Request("http://localhost:3000/login");
    const ctx: Record<string, unknown> = { req };

    const res = await mw(ctx as any, async () => {
      (ctx as any).session = { userId: "42", role: "admin" };
      return new Response("ok");
    });

    // Session data should be on the context
    expect((ctx as any).session).toEqual({ userId: "42", role: "admin" });

    // Cookie should be set
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("sid=");
  });

  it("continues without session in optional mode", async () => {
    const mw = session({ optional: true });

    const req = new Request("http://localhost:3000/public");
    const ctx: Record<string, unknown> = { req };

    let nextCalled = false;
    await mw(ctx as any, async () => {
      nextCalled = true;
      return new Response("ok");
    });

    expect(nextCalled).toBe(true);
    expect(ctx.session).toBeDefined();
  });
});
