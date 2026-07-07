import { describe, it, expect } from "bun:test";
import { Context } from "../../packages/core/src/context";
import { requestLogger } from "../../packages/logger/src/middleware";
import { createLogger } from "../../packages/logger/src/logger";
/**
 * Helper: create a Context from a path and optional init.
 */
function makeCtx(path = "/", init) {
    return new Context(new Request(`http://localhost:3000${path}`, init), {});
}
/**
 * Helper: create a captured stream to intercept logger output.
 */
function captureStream() {
    const lines = [];
    return {
        stream: { write: (text) => lines.push(text) },
        lines,
    };
}
/**
 * Helper: create a middleware pipeline and run a request.
 */
async function runMiddleware(mw, ctx, handlerResponse) {
    const handler = async () => handlerResponse ?? new Response("ok");
    return mw(ctx, handler);
}
describe("requestLogger middleware", () => {
    it("logs request and response for a successful handler", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false, name: "http" });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/users");
        const res = await runMiddleware(mw, ctx, new Response("ok", { status: 200 }));
        expect(res.status).toBe(200);
        expect(lines.length).toBeGreaterThanOrEqual(2);
        expect(lines[0]).toContain("[DBUG]");
        expect(lines[0]).toContain("→ GET /users");
        expect(lines[1]).toContain("[INFO]");
        expect(lines[1]).toContain("← GET /users");
        expect(lines[1]).toContain("200");
    });
    it("sets request ID on context store", async () => {
        const { stream } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/");
        await runMiddleware(mw, ctx);
        const requestId = ctx.store.get("requestId");
        expect(requestId).toBeDefined();
        expect(typeof requestId).toBe("string");
        expect(requestId.length).toBeGreaterThan(0);
    });
    it("uses custom request ID from x-request-id header", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log, logHeaders: false });
        const ctx = makeCtx("/", {
            headers: { "x-request-id": "custom-id-123" },
        });
        await runMiddleware(mw, ctx);
        expect(lines[0]).toContain("custom-id-123");
        expect(ctx.store.get("requestId")).toBe("custom-id-123");
    });
    it("uses custom request ID from x-trace-id header", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/", {
            headers: { "x-trace-id": "trace-456" },
        });
        await runMiddleware(mw, ctx);
        expect(lines[0]).toContain("trace-456");
    });
    it("uses custom request ID function", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({
            logger: log,
            requestId: () => "custom-fn-id",
        });
        const ctx = makeCtx("/");
        await runMiddleware(mw, ctx);
        expect(lines[0]).toContain("custom-fn-id");
    });
    it("excludes paths matching the exclude pattern", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({
            logger: log,
            excludePaths: [/^\/health/, /^\/metrics/],
        });
        const ctx1 = makeCtx("/health");
        await runMiddleware(mw, ctx1);
        expect(lines.length).toBe(0);
        const ctx2 = makeCtx("/api/users");
        await runMiddleware(mw, ctx2);
        expect(lines.length).toBeGreaterThanOrEqual(2);
    });
    it("logs query parameters when logQuery is enabled", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log, logQuery: true });
        const ctx = makeCtx("/search?q=test&page=1");
        await runMiddleware(mw, ctx);
        expect(lines[0]).toContain("q");
        expect(lines[0]).toContain("test");
        expect(lines[0]).toContain("page");
        expect(lines[0]).toContain("1");
    });
    it("does not log query when logQuery is disabled", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log, logQuery: false });
        const ctx = makeCtx("/search?q=test");
        await runMiddleware(mw, ctx);
        // Log should not contain query params
        expect(lines[0]).not.toContain("\"q\"");
        expect(lines[0]).not.toContain("\"test\"");
        expect(lines[0]).toContain("/search");
    });
    it("logs headers when logHeaders is enabled", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log, logHeaders: true });
        const ctx = makeCtx("/", {
            headers: { "user-agent": "bun-test", "accept": "application/json" },
        });
        await runMiddleware(mw, ctx);
        expect(lines[0]).toContain("user-agent");
        expect(lines[0]).toContain("bun-test");
        expect(lines[0]).toContain("accept");
        expect(lines[0]).toContain("application/json");
    });
    it("does not log sensitive headers", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log, logHeaders: true });
        const ctx = makeCtx("/", {
            headers: {
                "authorization": "Bearer secret-token",
                "cookie": "sid=abc123",
                "x-api-key": "api-key-123",
            },
        });
        await runMiddleware(mw, ctx);
        expect(lines[0]).not.toContain("authorization");
        expect(lines[0]).not.toContain("secret-token");
        expect(lines[0]).not.toContain("cookie");
        expect(lines[0]).not.toContain("x-api-key");
    });
    it("logs client errors at warn level", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/not-found");
        await runMiddleware(mw, ctx, new Response("Not Found", { status: 404 }));
        expect(lines[1]).toContain("[WARN]");
        expect(lines[1]).toContain("404");
    });
    it("logs server errors at error level", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/error");
        await runMiddleware(mw, ctx, new Response("Server Error", { status: 500 }));
        expect(lines[1]).toContain("[EROR]");
        expect(lines[1]).toContain("500");
    });
    it("logs successful requests at info level", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/success");
        await runMiddleware(mw, ctx, new Response("OK", { status: 200 }));
        expect(lines[1]).toContain("[INFO]");
        expect(lines[1]).toContain("200");
    });
    it("handles errors thrown by downstream handler", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/throws");
        const handler = async () => {
            throw new Error("handler error");
        };
        await expect(mw(ctx, handler)).rejects.toThrow("handler error");
        expect(lines.length).toBe(2);
        expect(lines[1]).toContain("[EROR]");
        expect(lines[1]).toContain("handler error");
    });
    it("logs redirect status (3xx) at info level", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx("/redirect");
        await runMiddleware(mw, ctx, new Response(null, { status: 302 }));
        expect(lines[1]).toContain("[INFO]");
        expect(lines[1]).toContain("302");
    });
    it("creates default logger when none provided", async () => {
        const mw = requestLogger();
        const ctx = makeCtx("/");
        const res = await runMiddleware(mw, ctx);
        expect(res.status).toBe(200);
    });
    it("truncates long paths", async () => {
        const { stream, lines } = captureStream();
        const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });
        const longPath = "/" + "a".repeat(300);
        const mw = requestLogger({ logger: log });
        const ctx = makeCtx(longPath);
        await runMiddleware(mw, ctx);
        expect(lines[0]).toContain("...");
        expect(lines[0].length).toBeLessThan(500);
    });
});
//# sourceMappingURL=middleware.test.js.map