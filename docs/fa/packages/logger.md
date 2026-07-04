# Logger — ثبت وقایع ساختاریافته

بسته `boxfw-logger` ثبت وقایع حرفه‌ای با خروجی pretty (توسعه) و JSON (تولید) و میان‌افزار ثبت خودکار درخواست را فراهم می‌کند.

## نصب

```bash
bun add boxfw-logger
```

## شروع سریع

```ts
import { createLogger, requestLogger } from "boxfw-logger";

const log = createLogger({ level: "debug" });
log.info("سرور شروع شد", { port: 3000 });
```

## API ثبت وقایع

```ts
const log = createLogger({
  level: "info",    // debug | info | warn | error | fatal
  format: "pretty", // pretty | json
  colors: true,     // رنگ‌های ANSI (حالت pretty)
  name: "my-app",   // نام برنامه
});

log.debug("اتصال به پایگاه داده...");
log.info("سرور شروع شد", { port: 3000 });
log.warn("مصرف حافظه بالا", { memoryMB: 512 });
log.error("اتصال به پایگاه داده شکست خورد", { error: err });
log.fatal("امکان بازیابی نیست");
```

## سطوح ثبت

| سطح | مقدار | توضیحات |
|------|--------|---------|
| `debug` | 0 | اطلاعات دیباگ |
| `info` | 1 | پیام‌های عمومی |
| `warn` | 2 | هشدارها |
| `error` | 3 | خطاها |
| `fatal` | 4 | خطاهای بحرانی |

## میان‌افزار ثبت درخواست

```ts
app.use(requestLogger({ logger: log, logQuery: true }));

// خروجی نمونه:
// [DBUG] http → → GET /users {"requestId":"a1b2c3d4"}
// [INFO] http → ← GET /users 200 42ms
// [WARN] http → ← GET /not-found 404 5ms
```

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: OpenAPI](openapi.md) · [بعدی: WebSocket](../guides/websocket.md)
