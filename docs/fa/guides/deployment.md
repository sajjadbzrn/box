# استقرار

Box روی **Bun** و **Cloudflare Workers** اجرا می‌شود. کد یکسان با تغییرات حداقلی در هر دو محیط مستقر می‌شود.

## استقرار در Bun

### توسعه

```bash
bun run --watch src/index.ts
```

### تولید

```bash
bun run src/index.ts
```

### Docker

```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

## استقرار در Cloudflare Workers

### نقطه ورود Worker

```ts
// src/worker-entry.ts
import { Box } from "boxfw-core";
import { workerEnv } from "boxfw-adapters";

const app = new Box();
// ... مسیرها و میان‌افزارها ...

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
```

### استقرار

```bash
npx wrangler deploy src/worker-entry.ts --name my-box-app
```

## اجرا در دو محیط

کد مسیرها را در هر دو محیط به اشتراک بگذارید:

```ts
// shared.ts
import { Box } from "boxfw-core";

export function createApp() {
  const app = new Box();
  app.get("/", (c) => c.json({ runtime: "چند پلتفرمی" }));
  return app;
}
```

```ts
// index.ts (Bun)
import { createApp } from "./shared";
createApp().listen({ port: 3000 });
```

```ts
// worker-entry.ts (Cloudflare)
import { createApp } from "./shared";
export default { fetch: (req, env) => createApp().fetch(req) };
```

## ملاحظات تولید

| موضوع | توصیه |
|-------|-------|
| **رمزها** | از متغیرهای محیطی استفاده کنید |
| **پایگاه داده** | از `boxfw-db` با مهاجرت Drizzle |
| **ثبت وقایع** | از `boxfw-logger` با فرمت JSON |
| **نشست‌ها** | `memoryStore()` را با Redis جایگزین کنید |

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: تست](testing.md) · [بعدی: معماری](../advanced/architecture.md)
