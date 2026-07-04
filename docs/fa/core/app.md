# App — کلاس اصلی برنامه

کلاس `App` (با نام `Box` صادر می‌شود) نقطه ورود هر برنامه Box است. این کلاس روتر، پایپلاین میان‌افزار و سرور HTTP را به هم متصل می‌کند.

## ایجاد برنامه

```ts
import { Box } from "boxfw-core";
const app = new Box();
```

## ثبت مسیرها

همه متدهای HTTP از طریق متدهای زنجیره‌ای پشتیبانی می‌شوند:

```ts
app.get("/users", listUsers);
app.post("/users", createUser);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);
app.patch("/users/:id", patchUser);
app.head("/health", healthCheck);
app.options("/cors", corsHandler);
app.route("PATCH", "/item/:id", handler);
```

## الگوهای مسیر

| الگو | مثال | توضیحات |
|------|------|---------|
| ایستا | `/users/list` | تطابق دقیق |
| پویا | `/user/:id` | دریافت بخش پارامتر به عنوان `params.id` |
| Wildcard | `/files/*` | دریافت مسیر باقی‌مانده به عنوان `params["*"]` |

## میان‌افزار

ثبت میان‌افزار سراسری با `.use()`:

```ts
app.use(async (c, next) => {
  const start = Date.now();
  const res = await next();
  console.log(`${c.method} ${c.path} — ${res.status} (${Date.now() - start}ms)`);
  return res;
});
```

## WebSocket

ثبت مسیرهای WebSocket با `.ws()`:

```ts
app.ws("/chat", {
  open: (ws) => console.log("متصل شد"),
  message: (ws, data) => ws.send(`پژواک: ${data}`),
  close: (ws) => console.log("قطع شد"),
});
```

## مدیریت خطا

```ts
app.notFound((c) => c.json({ error: "پیدا نشد" }, 404));
app.onError((error, c) => c.json({ error: "خطای داخلی سرور" }, 500));
```

## شروع سرور

```ts
app.listen({ port: 3000, hostname: "0.0.0.0" });

// Cloudflare Worker
export default {
  async fetch(request, env) { return app.fetch(request); },
};
```

## API

| متد | توضیحات |
|------|---------|
| `get/post/put/delete/patch/head/options` | ثبت مسیر |
| `ws(path, handlers)` | ثبت مسیر WebSocket |
| `use(middleware)` | افزودن میان‌افزار سراسری |
| `notFound(handler)` | بازنویسی هندلر 404 |
| `onError(handler)` | بازنویسی هندلر خطا |
| `fetch(request)` | هندلر اصلی درخواست |
| `listen(options)` | شروع سرور Bun |

---

> 📚 [بازگشت به فهرست](../index.md) · [بعدی: Context](context.md)
