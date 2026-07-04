# Validator — اعتبارسنجی درخواست

بسته `boxfw-validator` اعتبارسنجی درخواست بر اساس Zod با استنتاج نوع کامل TypeScript ارائه می‌دهد.

## نصب

```bash
bun add boxfw-validator zod
```

## شروع سریع

```ts
import { Box } from "boxfw-core";
import { v } from "boxfw-validator";
import { z } from "zod";

const app = new Box();

app.get("/user/:id", v(
  { params: z.object({ id: z.string() }) },
  (c) => c.json({ id: c.validated.params.id }),
));
```

## مکان‌های اعتبارسنجی

```ts
v({
  params:  z.object({ ... }),   // پارامترهای مسیر
  query:   z.object({ ... }),   // پارامترهای query string
  body:    z.object({ ... }),   // بدنه درخواست (JSON)
  headers: z.object({ ... }),   // هدرهای درخواست
}, handler);
```

## استنتاج نوع

```ts
v({ body: z.object({ name: z.string(), age: z.number() }) }, (c) => {
  c.validated.body.name.toUpperCase();  // ✅ string
  c.validated.body.age.toFixed(2);      // ✅ number
});
```

## خطاهای اعتبارسنجی

```json
{
  "error": "Invalid params",
  "issues": [{ "path": ["params", "id"], "message": "مقدار نامعتبر" }]
}
```

| تابع | توضیحات |
|------|---------|
| `v(schemas, handler)` | اعتبارسنجی و فراخوانی هندلر با `c.validated` تایپ‌شده |

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: Middleware](../core/middleware.md) · [بعدی: Adapters](adapters.md)
