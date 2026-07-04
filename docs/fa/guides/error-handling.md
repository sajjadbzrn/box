# مدیریت خطا

Box مدیریت خطای ساختاریافته با هندلرهای 404 و 500 سفارشی و خطاهای اعتبارسنجی از بسته validator ارائه می‌دهد.

## هندلرهای پیش‌فرض

- **404** — `"Not Found"` (پیدا نشد)
- **500** — `"Internal Server Error"` (خطای داخلی سرور)

## هندلر 404 سفارشی

```ts
app.notFound((c) => {
  return c.json({ error: "مسیر پیدا نشد", path: c.path }, 404);
});
```

## هندلر خطای سفارشی

```ts
app.onError((error, c) => {
  console.error("خطای مدیریت‌نشده:", error);
  return c.json({
    error: "خطای داخلی سرور",
    message: error.message,
  }, 500);
});
```

## خطاهای اعتبارسنجی

```ts
app.get("/user/:id", v(
  { params: z.object({ id: z.string().uuid() }) },
  (c) => c.json(c.validated.params),
));

// GET /user/abc → 400
// { "error": "Invalid params", "issues": [...] }
```

## بهترین روش‌ها

1. **همیشه یک Response برگردانید** — اجازه ندهید خطاها منتشر شوند
2. از **`onError`** برای فرمت‌بندی خطاهای سراسری استفاده کنید
3. **استک تریس را در تولید فاش نکنید**
4. **خطاها را ثبت کنید** — با بسته logger
5. **زود اعتبارسنجی کنید** — با `v()` قبل از منطق کسب و کار

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: WebSocket](websocket.md) · [بعدی: تست](testing.md)
