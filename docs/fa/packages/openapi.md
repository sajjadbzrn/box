# OpenAPI — تولید مشخصات API

بسته `boxfw-openapi` مشخصات OpenAPI 3.0 را از تعاریف مسیر شما به صورت خودکار تولید می‌کند.

## نصب

```bash
bun add boxfw-openapi
```

## شروع سریع

```ts
import { Box } from "boxfw-core";
import { openapi } from "boxfw-openapi";

const app = new Box();

app.get("/users", (c) => c.json([]));
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json(body, 201);
});

app.get("/openapi.json", openapi(
  { title: "API من", version: "1.0.0" },
  [
    { method: "GET", path: "/users", summary: "لیست کاربران", tags: ["Users"] },
    { method: "POST", path: "/users", summary: "ایجاد کاربر", tags: ["Users"] },
  ],
));
```

## تعریف مسیر

```ts
interface RouteSpec {
  method: string;
  path: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: Record<string, string>;
  summary?: string;
  tags?: string[];
}
```

پارامترهای مسیر (`:id`) به فرمت OpenAPI (`{id}`) تبدیل می‌شوند.

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: i18n](i18n.md) · [بعدی: Logger](logger.md)
