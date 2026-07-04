# Context — شی درخواست/پاسخ

`Context` شی یکپارچه درخواست/پاسخ است که از طریق زنجیره میان‌افزار و به هندلرهای مسیر ارسال می‌شود.

## دسترسی به داده‌های درخواست

```ts
app.get("/user/:id", (c) => {
  c.params.id;           // پارامتر مسیر
  c.url;                 // شی URL
  c.path;                // "/user/42"
  c.query;               // URLSearchParams
  c.queryParam("page");  // string | null
  c.method;              // "GET"
  c.headers;             // هدرها
  c.headerValue("accept");
  c.req;                 // شی Request
});
```

## خواندن بدنه درخواست

```ts
app.post("/users", async (c) => {
  const body = await c.req.json();     // JSON
  const text = await c.req.text();     // متن
  const form = await c.req.formData(); // فرم
  return c.json({ received: body });
});
```

## ساخت پاسخ

```ts
c.json({ ok: true });           // 200
c.json({ created: true }, 201); // 201
c.text("سلام!", 200);
c.html("<h1>سلام</h1>");
c.redirect("/login");           // 302
c.redirect("/permanent", 301);  // 301
```

## API زنجیره‌ای

```ts
c.status(201).header("X-Custom", "value").json({ data: "ایجاد شد" });
```

## متغیرهای محیطی

```ts
const dbUrl = c.env("DATABASE_URL");
const db = c.env<D1Database>("DB");
```

## حافظه موقت درخواست

```ts
app.use(async (c, next) => {
  c.store.set("requestId", crypto.randomUUID());
  return next();
});

app.get("/", (c) => {
  return c.json({ requestId: c.store.get("requestId") });
});
```

## متدهای پاسخ

| متد | توضیحات |
|------|---------|
| `status(code)` | تنظیم وضعیت HTTP |
| `header(name, value)` | تنظیم هدر پاسخ |
| `json(data, status?)` | پاسخ JSON |
| `text(data, status?)` | پاسخ متنی |
| `html(data, status?)` | پاسخ HTML |
| `redirect(url, status?)` | تغییر مسیر |
| `env(key)` | خواندن متغیر محیطی |

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: App](app.md) · [بعدی: Router](router.md)
