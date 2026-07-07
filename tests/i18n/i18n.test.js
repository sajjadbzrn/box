import { describe, it, expect } from "bun:test";
import { localeDetect, t, bilingualError, rtlMeta, isRtl } from "../../packages/i18n/src/index";
import { Context } from "../../packages/core/src/context";
const dict = {
    en: { hello: "Hello", not_found: "Not Found", error: "Error" },
    fa: { hello: "سلام", not_found: "پیدا نشد", error: "خطا" },
};
describe("localeDetect middleware", () => {
    it("sets c.locale from Accept-Language header", async () => {
        const mw = localeDetect({ default: "en", supported: ["en", "fa"] });
        const req = new Request("http://localhost:3000/", {
            headers: { "accept-language": "fa-IR,fa;q=0.9,en;q=0.8" },
        });
        const ctx = new Context(req);
        await mw(ctx, async () => new Response("ok"));
        expect(ctx.locale).toBe("fa");
    });
    it("falls back to default when no header matches", async () => {
        const mw = localeDetect({ default: "en", supported: ["en", "fa"] });
        const req = new Request("http://localhost:3000/", {
            headers: { "accept-language": "de-DE" },
        });
        const ctx = new Context(req);
        await mw(ctx, async () => new Response("ok"));
        expect(ctx.locale).toBe("en");
    });
    it("falls back when no headers at all", async () => {
        const mw = localeDetect({ default: "en", supported: ["en", "fa"] });
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        await mw(ctx, async () => new Response("ok"));
        expect(ctx.locale).toBe("en");
    });
});
describe("t() — translation helper", () => {
    it("translates a key to the current locale", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        ctx.locale = "fa";
        expect(t(ctx, "hello", dict)).toBe("سلام");
        expect(t(ctx, "not_found", dict)).toBe("پیدا نشد");
    });
    it("falls back to first dictionary locale if current locale is missing", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        ctx.locale = "es"; // not in dict
        expect(t(ctx, "hello", dict)).toBe("Hello"); // falls back to "en"
    });
    it("returns the key itself if no translation found", () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        ctx.locale = "fa";
        expect(t(ctx, "missing_key", dict)).toBe("missing_key");
    });
});
describe("bilingualError()", () => {
    it("returns a 400 JSON response with translated error message", async () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        ctx.locale = "fa";
        const res = bilingualError(ctx, "not_found", dict);
        const body = await res.json();
        expect(res.status).toBe(400);
        expect(body.error).toBe("پیدا نشد");
    });
    it("accepts a custom status code", async () => {
        const req = new Request("http://localhost:3000/");
        const ctx = new Context(req);
        ctx.locale = "en";
        const res = bilingualError(ctx, "not_found", dict, 404);
        const body = await res.json();
        expect(res.status).toBe(404);
        expect(body.error).toBe("Not Found");
    });
});
describe("rtlMeta() and isRtl()", () => {
    it("isRtl returns true for Persian, Arabic, Hebrew", () => {
        expect(isRtl("fa")).toBe(true);
        expect(isRtl("ar")).toBe(true);
        expect(isRtl("he")).toBe(true);
    });
    it("isRtl returns false for English, French, Spanish", () => {
        expect(isRtl("en")).toBe(false);
        expect(isRtl("fr")).toBe(false);
        expect(isRtl("es")).toBe(false);
    });
    it("rtlMeta returns dir and locale", () => {
        expect(rtlMeta("fa")).toEqual({ dir: "rtl", locale: "fa" });
        expect(rtlMeta("en")).toEqual({ dir: "ltr", locale: "en" });
    });
});
//# sourceMappingURL=i18n.test.js.map