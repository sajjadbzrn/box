# Middleware — پایپلاین مدل پیازی

میان‌افزار در Box از **مدل پیازی** پیروی می‌کند — هر میان‌افزار لایه‌ای دور دیگری می‌پیچد تا به هندلر مسیر برسد.

## امضا

```ts
type Middleware = (
  c: Context,
  next: () => Promise<Response>,
) => Promise<Response>;
```

## میان‌افزار پایه

```ts
// میان‌افزار ثبت وقایع
app.use(async (c, next) => {
  const start = Date.now();
  const res = await next();
  console.log(`${c.method} ${c.path} ${res.status} ${Date.now() - start}ms`);
  return res;
});

// تزریق هدر
app.use(async (c, next) => {
  c.header("X-Powered-By", "Box");
  return next();
});
```

## قطع کردن زنجیره

```ts
app.use(async (c, next) => {
  const token = c.headerValue("authorization");
  if (!token) return c.text("غیرمجاز", 401);
  return next();
});
```

## ترتیب اجرای پیازی

```text
درخواست → میان‌افزار 1 (قبل از next)
               → میان‌افزار 2 (قبل از next)
                    → هندلر مسیر
               → میان‌افزار 2 (بعد از next)
          → میان‌افزار 1 (بعد از next)
     → پاسخ
```

## بهترین روش‌ها

- **میان‌افزار را قبل از مسیرها ثبت کنید** — ترتیب مهم است
- از **`c.store`** برای انتقال داده بین میان‌افزارها استفاده کنید
- **`next()` را دو بار صدا نزنید** — خطا پرتاب می‌کند
- **همیشه یک Response برگردانید** — یا از `next()` یا مستقیماً

## بسته‌های میان‌افزار داخلی

| بسته | میان‌افزار | توضیحات |
|------|-----------|---------|
| `boxfw-validator` | `v(schemas, handler)` | اعتبارسنجی درخواست |
| `boxfw-db` | `D(client)` | تزریق Drizzle ORM |
| `boxfw-auth` | `jwt(options)` | احراز هویت JWT |
| `boxfw-auth` | `session(options)` | مدیریت نشست |
| `boxfw-i18n` | `localeDetect(config)` | تشخیص زبان |
| `boxfw-logger` | `requestLogger(options)` | ثبت درخواست |

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: Router](router.md) · [بعدی: Validator](../packages/validator.md)
