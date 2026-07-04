# تست

برنامه‌های Box با **تست‌ران داخلی Bun** تست می‌شوند. تست‌ها از API استاندارد Web `Request`/`Response` استفاده می‌کنند.

## تنظیم تست

```ts
// tests/app.test.ts
import { describe, it, expect } from "bun:test";
import { Box } from "boxfw-core";
```

اجرای تست:

```bash
bun test
```

## تست هندلرها

```ts
describe("Routes", () => {
  it("GET / returns hello", async () => {
    const app = new Box();
    app.get("/", (c) => c.text("سلام!"));

    const res = await app.fetch(new Request("http://localhost:3000/"));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toBe("سلام!");
  });
});
```

## تست میان‌افزار

```ts
describe("Middleware", () => {
  it("اجرا به ترتیب پیازی", async () => {
    const order: string[] = [];
    const mw = async (_c: any, next: () => Promise<Response>) => {
      order.push("قبل");
      const res = await next();
      order.push("بعد");
      return res;
    };
    const pipeline = compose([mw]);
    // ...
  });
});
```

## تست اعتبارسنجی

```ts
describe("Validation", () => {
  it("ورودی نامعتبر را رد می‌کند", async () => {
    const handler = v(
      { params: z.object({ id: z.string() }) },
      (c) => c.json(c.validated.params),
    );
    const { Context } = await import("boxfw-core");
    const ctx = new Context(new Request("http://localhost:3000/user/"), { id: "" });
    const res = await handler(ctx as any);
    expect(res.status).toBe(400);
  });
});
```

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: مدیریت خطا](error-handling.md) · [بعدی: استقرار](deployment.md)
