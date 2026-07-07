import { describe, it, expect } from "bun:test";
import { Context } from "../../packages/core/src/context";
describe("Context", () => {
    it("exposes method, path, and query", () => {
        const req = new Request("http://localhost:3000/api/users?page=2", {
            method: "GET",
            headers: { "accept": "application/json" },
        });
        const ctx = new Context(req, { id: "42" });
        expect(ctx.method).toBe("GET");
        expect(ctx.path).toBe("/api/users");
        expect(ctx.params.id).toBe("42");
        expect(ctx.queryParam("page")).toBe("2");
    });
    it("header getter works", () => {
        const req = new Request("http://localhost:3000/", {
            headers: { "x-custom": "hello" },
        });
        const ctx = new Context(req);
        expect(ctx.headerValue("x-custom")).toBe("hello");
        expect(ctx.headerValue("X-CUSTOM")).toBe("hello");
    });
    it("json response helper sets content-type", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        const res = ctx.json({ ok: true });
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/json");
    });
    it("status method sets response status", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        const res = ctx.status(201).json({ created: true });
        expect(res.status).toBe(201);
    });
    it("text response helper", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        const res = ctx.text("hello world");
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("text/plain");
    });
    it("html response helper", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        const res = ctx.html("<h1>Hello</h1>");
        expect(res.headers.get("content-type")).toContain("text/html");
    });
    it("redirect helper sets location and default 302", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        const res = ctx.redirect("/new-path");
        expect(res.status).toBe(302);
        expect(res.headers.get("location")).toBe("/new-path");
    });
    it("redirect supports custom status", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        const res = ctx.redirect("/perm", 301);
        expect(res.status).toBe(301);
    });
    it("custom header on response", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        const res = ctx.header("x-custom", "val").json({});
        expect(res.headers.get("x-custom")).toBe("val");
    });
    it("json body parsing works via ctx.req.json()", async () => {
        const req = new Request("http://localhost:3000/", {
            method: "POST",
            body: JSON.stringify({ name: "Box" }),
        });
        const ctx = new Context(req);
        const body = (await ctx.req.json());
        expect(body.name).toBe("Box");
    });
    it("store allows attaching arbitrary data", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        ctx.store.set("requestId", "abc-123");
        expect(ctx.store.get("requestId")).toBe("abc-123");
    });
});
//# sourceMappingURL=context.test.js.map