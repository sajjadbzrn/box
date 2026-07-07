import { describe, it, expect } from "bun:test";
import { openapi, zodToOpenApi } from "../../packages/openapi/src/index";
describe("openapi()", () => {
    it("generates a valid OpenAPI 3.0 document", () => {
        const handler = openapi({ title: "Test API", version: "1.0.0", description: "A test" }, [
            { method: "GET", path: "/users", summary: "List users", tags: ["Users"] },
            { method: "POST", path: "/users", summary: "Create user", body: { name: "User name", email: "Email" } },
        ]);
        const res = handler();
        expect(res.headers.get("content-type")).toContain("json");
        return res.json().then((doc) => {
            expect(doc.openapi).toBe("3.0.3");
            expect(doc.info.title).toBe("Test API");
            expect(doc.info.version).toBe("1.0.0");
            expect(doc.paths["/users"].get.summary).toBe("List users");
            expect(doc.paths["/users"].post.summary).toBe("Create user");
            expect(doc.paths["/users"].post.requestBody).toBeDefined();
        });
    });
    it("converts :param paths to {param}", () => {
        const handler = openapi({ title: "API", version: "1.0.0" }, [{ method: "GET", path: "/user/:id", params: { id: "User ID" } }]);
        return handler().json().then((doc) => {
            expect(doc.paths["/user/{id}"]).toBeDefined();
            expect(doc.paths["/user/{id}"].get.parameters[0].name).toBe("id");
            expect(doc.paths["/user/{id}"].get.parameters[0].in).toBe("path");
            expect(doc.paths["/user/{id}"].get.parameters[0].required).toBe(true);
        });
    });
});
describe("zodToOpenApi()", () => {
    it("extracts properties from a Zod schema shape", () => {
        // Simulate a Zod schema shape without importing zod
        const schema = {
            shape: {
                name: { _def: { typeName: "ZodString" } },
                age: { _def: { typeName: "ZodNumber" } },
                active: { _def: { typeName: "ZodBoolean" } },
            },
        };
        const props = zodToOpenApi(schema);
        expect(props.name).toEqual({ type: "string" });
        expect(props.age).toEqual({ type: "number" });
        expect(props.active).toEqual({ type: "boolean" });
    });
    it("returns empty object for non-object schemas", () => {
        expect(zodToOpenApi({})).toEqual({});
        expect(zodToOpenApi(null)).toEqual({});
    });
});
//# sourceMappingURL=spec.test.js.map