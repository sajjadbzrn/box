import { describe, it, expect } from "bun:test";
import { Router } from "../../packages/core/src/router";
describe("Router — static routes", () => {
    it("matches a simple static path", () => {
        const router = new Router();
        const handler = () => new Response("ok");
        router.add("GET", "/hello", handler);
        const match = router.lookup("GET", "/hello");
        expect(match).not.toBeNull();
        expect(match.params).toEqual({});
    });
    it("matches a root path", () => {
        const router = new Router();
        const handler = () => new Response("ok");
        router.add("GET", "/", handler);
        const match = router.lookup("GET", "/");
        expect(match).not.toBeNull();
        expect(match.handler).toBe(handler);
    });
    it("matches nested static paths", () => {
        const router = new Router();
        const handler = () => new Response("ok");
        router.add("GET", "/api/v1/users", handler);
        const match = router.lookup("GET", "/api/v1/users");
        expect(match).not.toBeNull();
        expect(match.handler).toBe(handler);
    });
    it("returns null for non-existent path", () => {
        const router = new Router();
        router.add("GET", "/hello", () => new Response("ok"));
        expect(router.lookup("GET", "/world")).toBeNull();
    });
    it("returns null for different method on same path", () => {
        const router = new Router();
        router.add("GET", "/hello", () => new Response("ok"));
        expect(router.lookup("POST", "/hello")).toBeNull();
    });
    it("matches routes with shared prefixes correctly", () => {
        const router = new Router();
        const a = () => new Response("a");
        const b = () => new Response("b");
        router.add("GET", "/a", a);
        router.add("GET", "/ab", b);
        expect(router.lookup("GET", "/a").handler).toBe(a);
        expect(router.lookup("GET", "/ab").handler).toBe(b);
    });
    it("matches longer path before prefix confusion", () => {
        const router = new Router();
        const users = () => new Response("users");
        const userPosts = () => new Response("user posts");
        router.add("GET", "/users", users);
        router.add("GET", "/users/posts", userPosts);
        expect(router.lookup("GET", "/users").handler).toBe(users);
        expect(router.lookup("GET", "/users/posts").handler).toBe(userPosts);
    });
});
describe("Router — dynamic routes (:param)", () => {
    it("extracts a single named param", () => {
        const router = new Router();
        const handler = () => new Response("ok");
        router.add("GET", "/user/:id", handler);
        const match = router.lookup("GET", "/user/42");
        expect(match).not.toBeNull();
        expect(match.params).toEqual({ id: "42" });
        expect(match.handler).toBe(handler);
    });
    it("extracts multiple named params", () => {
        const router = new Router();
        router.add("GET", "/org/:orgId/repo/:repoName", () => new Response("ok"));
        const match = router.lookup("GET", "/org/acme/repo/box");
        expect(match).not.toBeNull();
        expect(match.params).toEqual({ orgId: "acme", repoName: "box" });
    });
    it("matches static over dynamic when ambiguous prefix", () => {
        const router = new Router();
        const staticHandler = () => new Response("static");
        const dynamicHandler = () => new Response("dynamic");
        router.add("GET", "/user/me", staticHandler);
        router.add("GET", "/user/:id", dynamicHandler);
        // Static should match first since we check static children first
        const match = router.lookup("GET", "/user/me");
        expect(match).not.toBeNull();
        expect(match.handler).toBe(staticHandler);
    });
    it("falls back to dynamic when static doesn't match", () => {
        const router = new Router();
        const staticHandler = () => new Response("static");
        const dynamicHandler = () => new Response("dynamic");
        router.add("GET", "/user/me", staticHandler);
        router.add("GET", "/user/:id", dynamicHandler);
        const match = router.lookup("GET", "/user/other");
        expect(match).not.toBeNull();
        expect(match.handler).toBe(dynamicHandler);
        expect(match.params).toEqual({ id: "other" });
    });
});
describe("Router — wildcard routes (*)", () => {
    it("captures remaining path as '*' param", () => {
        const router = new Router();
        router.add("GET", "/files/*", () => new Response("ok"));
        const match = router.lookup("GET", "/files/hello.txt");
        expect(match).not.toBeNull();
        expect(match.params).toEqual({ "*": "hello.txt" });
    });
    it("captures nested wildcard paths", () => {
        const router = new Router();
        router.add("GET", "/static/*", () => new Response("ok"));
        const match = router.lookup("GET", "/static/css/main.css");
        expect(match).not.toBeNull();
        expect(match.params).toEqual({ "*": "css/main.css" });
    });
    it("wildcard matches single segment", () => {
        const router = new Router();
        router.add("GET", "/*", () => new Response("ok"));
        const match = router.lookup("GET", "/anything");
        expect(match).not.toBeNull();
        expect(match.params).toEqual({ "*": "anything" });
    });
});
describe("Router — HTTP method isolation", () => {
    it("supports GET, POST, PUT, DELETE independently on same path", () => {
        const router = new Router();
        const getH = () => new Response("get");
        const postH = () => new Response("post");
        const putH = () => new Response("put");
        const deleteH = () => new Response("delete");
        router.add("GET", "/item", getH);
        router.add("POST", "/item", postH);
        router.add("PUT", "/item", putH);
        router.add("DELETE", "/item", deleteH);
        expect(router.lookup("GET", "/item").handler).toBe(getH);
        expect(router.lookup("POST", "/item").handler).toBe(postH);
        expect(router.lookup("PUT", "/item").handler).toBe(putH);
        expect(router.lookup("DELETE", "/item").handler).toBe(deleteH);
    });
});
//# sourceMappingURL=router.test.js.map