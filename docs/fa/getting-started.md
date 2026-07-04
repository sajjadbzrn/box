# شروع سریع با Box

## نصب

### ایجاد پروژه جدید (توصیه شده)

```bash
bunx create-boxfw
```

پس از پاسخ به سوالات تعاملی، پروژه شما ساخته می‌شود. سپس:

```bash
cd my-project
bun install
bun run dev
```

### نصب دستی

```bash
mkdir my-app && cd my-app
bun init -y
bun add boxfw-core
```

## شروع سریع

```ts
import { Box } from "boxfw-core";

const app = new Box();

app.get("/", (c) => {
  return c.json({ message: "سلام، Box!" });
});

app.get("/user/:id", (c) => {
  return c.json({ id: c.params.id });
});

app.listen({ port: 3000 });
console.log("سرور در حال اجرا در http://localhost:3000");
```

## ساختار پروژه

یک پروژه Box معمولی به این صورت است:

```
my-app/
├── src/
│   ├── index.ts          # نقطه ورود
│   └── worker-entry.ts   # ورود Worker (در صورت نیاز)
├── drizzle/
│   └── schema.ts         # طرح Drizzle (در صورت استفاده)
├── locales/
│   ├── en.json           # ترجمه انگلیسی
│   └── fa.json           # ترجمه فارسی
├── package.json
└── tsconfig.json
```

## مراحل بعدی

| موضوع | مستند |
|-------|-------|
| مفاهیم اصلی | [App →](core/app.md) · [Context →](core/context.md) · [Router →](core/router.md) |
| اعتبارسنجی | [Validator →](../packages/validator.md) |
| پایگاه داده | [DB →](../packages/db.md) |
| احراز هویت | [Auth →](../packages/auth.md) |
| بومی‌سازی | [i18n →](../packages/i18n.md) |
| ثبت وقایع | [Logger →](../packages/logger.md) |
| OpenAPI | [OpenAPI →](../packages/openapi.md) |
| WebSocket | [WebSocket →](../guides/websocket.md) |
| استقرار | [Deployment →](../guides/deployment.md) |
