import { describe, expect, it } from "bun:test";
import { jwt, signJwt } from "../../packages/auth/src/index";

describe("jwt middleware", () => {
  const secret = "test-secret-key";

  it("short-circuits with 401 when no token is provided", async () => {
    const mw = jwt({ secret });

    const req = new Request("http://localhost:3000/me");
    const ctx: Record<string, unknown> = { req };

    const res = await mw(ctx as any, async () => new Response("ok"));

    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(401);
  });

  it("short-circuits with 401 for invalid token format", async () => {
    const mw = jwt({ secret });

    const req = new Request("http://localhost:3000/me", {
      headers: { authorization: "Bearer not.a.jwt" },
    });
    const ctx: Record<string, unknown> = { req };

    const res = await mw(ctx as any, async () => new Response("ok"));

    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(401);
  });

  it("passes through for optional mode with no token", async () => {
    const mw = jwt({ secret, optional: true });

    const req = new Request("http://localhost:3000/public");
    const ctx: Record<string, unknown> = { req };

    let nextCalled = false;
    const res = await mw(ctx as any, async () => {
      nextCalled = true;
      return new Response("ok");
    });

    expect(nextCalled).toBe(true);
    expect(ctx.jwt).toBeNull();
    expect((res as Response).status).toBe(200);
  });

  it("reads token from Authorization header", async () => {
    const token = await signJwt({ sub: "user-1", role: "admin" }, secret, 60);

    const req = new Request("http://localhost:3000/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    const ctx: Record<string, unknown> = { req };

    let payload: Record<string, unknown> | null = null;
    const res = await jwt({ secret })(ctx as any, async () => {
      payload = (ctx as Record<string, unknown>).jwt as Record<string, unknown>;
      return new Response("ok");
    });

    expect((res as Response).status).toBe(200);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe("user-1");
    expect(payload!.role).toBe("admin");
  });

  it("reads token from named cookie", async () => {
    const token = await signJwt({ sub: "user-2" }, secret, 60);

    const req = new Request("http://localhost:3000/me", {
      headers: { cookie: `auth_token=${token}` },
    });
    const ctx: Record<string, unknown> = { req };

    let payload: Record<string, unknown> | null = null;
    const res = await jwt({ secret, cookie: "auth_token" })(ctx as any, async () => {
      payload = (ctx as Record<string, unknown>).jwt as Record<string, unknown>;
      return new Response("ok");
    });

    expect((res as Response).status).toBe(200);
    expect(payload!.sub).toBe("user-2");
  });
});

describe("signJwt", () => {
  it("creates a valid JWT that can be verified by the middleware", async () => {
    const secret = "my-secret";
    const token = await signJwt({ userId: "123" }, secret, 3600);

    // token should be 3 parts
    const parts = token.split(".");
    expect(parts.length).toBe(3);

    // Verify it works with the middleware
    const req = new Request("http://localhost:3000/", {
      headers: { authorization: `Bearer ${token}` },
    });
    const ctx: Record<string, unknown> = { req };

    let payload: Record<string, unknown> | null = null;
    await jwt({ secret })(ctx as any, async () => {
      payload = (ctx as Record<string, unknown>).jwt as Record<string, unknown>;
      return new Response("ok");
    });

    expect(payload!.userId).toBe("123");
  });
});
