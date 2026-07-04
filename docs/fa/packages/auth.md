# Auth — احراز هویت

بسته `boxfw-auth` احراز هویت JWT (HS256) و نشست مبتنی بر کوکی را فراهم می‌کند. هر دو در Bun و Cloudflare Workers با Web Crypto API کار می‌کنند.

## نصب

```bash
bun add boxfw-auth
```

## JWT

```ts
import { jwt, signJwt } from "boxfw-auth";

const app = new Box();

app.use(jwt({ secret: c.env("JWT_SECRET") ?? "dev-secret" }));

app.post("/login", async (c) => {
  const { username } = await c.req.json();
  const token = await signJwt({ sub: username, role: "user" }, "secret", 3600);
  return c.json({ token });
});

app.get("/me", (c) => {
  const user = c.jwt; // { sub, role, iat, exp }
  return c.json({ user });
});
```

### گزینه‌ها

| گزینه | نوع | پیش‌فرض | توضیحات |
|-------|------|---------|---------|
| `secret` | `string` | ضروری | کلید HMAC |
| `cookie` | `string` | — | نام کوکی برای خواندن توکن |
| `optional` | `boolean` | `false` | رد شدن در صورت نبود توکن |

## نشست (Session)

```ts
import { session, memoryStore } from "boxfw-auth";

app.use(session());

app.post("/login", async (c) => {
  c.session.userId = "42";
  c.session.role = "admin";
  return c.json({ ok: true });
});

app.get("/me", (c) => {
  return c.json({ userId: c.session.userId });
});
```

### گزینه‌ها

| گزینه | نوع | پیش‌فرض | توضیحات |
|-------|------|---------|---------|
| `cookieName` | `string` | `"sid"` | نام کوکی نشست |
| `ttl` | `number` | `86400` | مدت اعتبار (ثانیه) |
| `store` | `SessionStore` | `memoryStore()` | محل ذخیره‌سازی |

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: DB](db.md) · [بعدی: i18n](i18n.md)
