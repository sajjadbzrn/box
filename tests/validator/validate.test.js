import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { v } from "../../packages/validator/src/validate";
function makeRequest(path, init) {
    return new Request(`http://localhost:3000${path}`, init);
}
async function runHandler(handler, req) {
    // We need a minimal Context-like object. The handler only uses c.json(), c.params, etc.
    // But v() expects a full Context. Let's create a real Context.
    const { Context } = await import("../../packages/core/src/context");
    const url = new URL(req.url);
    const c = new Context(req);
    return handler(c);
}
async function getResponseBody(res) {
    return res.json();
}
// ---- Params validation ----
describe("v() — params validation", () => {
    const schema = { params: z.object({ id: z.string().min(1) }) };
    it("passes valid params and makes them typed on c.validated", async () => {
        const handler = v(schema, (c) => {
            // Type-level: c.validated.params.id is string
            const id = c.validated.params.id;
            return c.json({ id });
        });
        // Simulate a request with params injected into the context
        // We need to set up the context so params are available
        const req = makeRequest("/user/42");
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req, { id: "42" });
        const res = await handler(ctx);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body).toEqual({ id: "42" });
    });
    it("returns 400 and structured error for invalid params", async () => {
        const handler = v(schema, (c) => {
            return c.json(c.validated.params);
        });
        const req = makeRequest("/user/");
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req, { id: "" });
        const res = await handler(ctx);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe("Invalid params");
        expect(body.issues).toBeDefined();
        expect(body.issues.length).toBeGreaterThan(0);
    });
});
// ---- Query validation ----
describe("v() — query validation", () => {
    const schema = {
        query: z.object({
            page: z.coerce.number().int().positive().default(1),
            q: z.string().optional(),
        }),
    };
    it("validates and coerces query params", async () => {
        const handler = v(schema, (c) => {
            const page = c.validated.query.page;
            const q = c.validated.query.q;
            return c.json({ page, q });
        });
        const req = makeRequest("/search?page=3&q=box");
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.page).toBe(3);
        expect(body.q).toBe("box");
    });
    it("applies default values when query param is missing", async () => {
        const handler = v(schema, (c) => {
            return c.json({ page: c.validated.query.page });
        });
        const req = makeRequest("/search");
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.page).toBe(1); // default
    });
    it("returns 400 for invalid query types", async () => {
        const handler = v(schema, (c) => {
            return c.json({ page: c.validated.query.page });
        });
        const req = makeRequest("/search?page=abc");
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe("Invalid query");
        expect(body.issues.length).toBeGreaterThan(0);
    });
});
// ---- Body validation ----
describe("v() — body validation", () => {
    const schema = {
        body: z.object({
            name: z.string().min(1),
            email: z.string().email(),
        }),
    };
    it("validates body and passes typed data to handler", async () => {
        const handler = v(schema, async (c) => {
            const { name, email } = c.validated.body;
            return c.json({ name, email }, 201);
        });
        const req = makeRequest("/user", {
            method: "POST",
            body: JSON.stringify({ name: "Box", email: "box@test.com" }),
            headers: { "content-type": "application/json" },
        });
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.name).toBe("Box");
        expect(body.email).toBe("box@test.com");
    });
    it("returns 400 when body is missing required fields", async () => {
        const handler = v(schema, async (c) => {
            return c.json(c.validated.body);
        });
        const req = makeRequest("/user", {
            method: "POST",
            body: JSON.stringify({ name: "Box" }),
            headers: { "content-type": "application/json" },
        });
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe("Invalid body");
    });
    it("returns 400 when body is not valid JSON", async () => {
        const handler = v(schema, async (c) => {
            return c.json(c.validated.body);
        });
        const req = makeRequest("/user", {
            method: "POST",
            body: "not-json",
            headers: { "content-type": "application/json" },
        });
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        // null body fails schema validation
        expect(res.status).toBe(400);
    });
});
// ---- Combined validation ----
describe("v() — combined schemas", () => {
    const schemas = {
        params: z.object({ userId: z.string().uuid() }),
        query: z.object({ format: z.enum(["json", "xml"]).optional() }),
        body: z.object({ action: z.literal("activate").or(z.literal("deactivate")) }).optional(),
    };
    it("validates all three simultaneously", async () => {
        const handler = v(schemas, async (c) => {
            return c.json({
                userId: c.validated.params.userId,
                format: c.validated.query.format ?? "json",
                action: c.validated.body?.action,
            });
        });
        const req = makeRequest("/user/550e8400-e29b-41d4-a716-446655440000?format=json", {
            method: "POST",
            body: JSON.stringify({ action: "activate" }),
            headers: { "content-type": "application/json" },
        });
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req, { userId: "550e8400-e29b-41d4-a716-446655440000" });
        const res = await handler(ctx);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.userId).toBe("550e8400-e29b-41d4-a716-446655440000");
        expect(body.format).toBe("json");
        expect(body.action).toBe("activate");
    });
});
// ---- Header validation ----
describe("v() — header validation", () => {
    const schema = {
        headers: z.object({
            "x-api-key": z.string().min(1),
        }),
    };
    it("validates custom headers", async () => {
        const handler = v(schema, (c) => {
            return c.json({ key: c.validated.headers["x-api-key"] });
        });
        const req = makeRequest("/api/data", {
            headers: { "x-api-key": "secret-123" },
        });
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.key).toBe("secret-123");
    });
    it("returns 400 when required header is missing", async () => {
        const handler = v(schema, (c) => {
            return c.json(c.validated.headers);
        });
        const req = makeRequest("/api/data");
        const { Context: Ctx } = await import("../../packages/core/src/context");
        const ctx = new Ctx(req);
        const res = await handler(ctx);
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.error).toBe("Invalid headers");
    });
});
//# sourceMappingURL=validate.test.js.map