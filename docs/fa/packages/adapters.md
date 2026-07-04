# Adapters — پشتیبانی از دو محیط اجرا

بسته `boxfw-adapters` دسترسی به متغیرهای محیطی را برای Bun و Cloudflare Workers یکسان می‌کند.

## نصب

```bash
bun add boxfw-adapters
```

## استفاده در Bun

```ts
import { Box } from "boxfw-core";
import { bunEnv } from "boxfw-adapters";

const app = new Box();
app.setEnv(bunEnv());

app.get("/", (c) => {
  const dbUrl = c.env("DATABASE_URL");
  return c.json({ dbUrl });
});

app.listen({ port: 3000 });
```

## استفاده در Cloudflare Workers

```ts
import { Box } from "boxfw-core";
import { workerEnv } from "boxfw-adapters";

const app = new Box();

app.get("/", (c) => {
  const dbUrl = c.env("DATABASE_URL");
  const kv = c.env<KVNamespace>("KV_STORE");
  return c.json({ dbUrl, kv: kv ? "حاضر" : "غایب" });
});

export default {
  async fetch(request, env) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
```

## API

| تابع | توضیحات |
|------|---------|
| `bunEnv()` | EnvStore از `Bun.env` / `process.env` |
| `workerEnv(bindings)` | EnvStore از شی `env` Worker |
| `c.env(key)` | خواندن متغیر محیطی با نوع `T` |

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: Validator](validator.md) · [بعدی: DB](db.md)
