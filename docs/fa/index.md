# مستندات فریمورک Box

> **فریمورک بک‌اند همه‌کاره برای توسعه‌دهندگان انفرادی و مستقل**  
> بومی Bun، بهینه برای Edge، با پشتیبانی درجه یک از Drizzle، بومی‌سازی (i18n) و اجرا در دو محیط.

## نمای کلی

Box یک فریمورک وب مبتنی بر TypeScript است که برای **Bun** و **Cloudflare Workers** ساخته شده. این فریمورک یک روتر درخت رادیکس سریع، میان‌افزار مدل پیازی و مجموعه‌ای غنی از بسته‌های اختیاری را ترکیب می‌کند تا همه چیز مورد نیاز برای ارسال برنامه‌های full-stack به edge را داشته باشید.

## فهرست مطالب

### 🚀 شروع سریع

| مستند | توضیحات |
|-------|---------|
| [شروع سریع](getting-started.md) | نصب، شروع سریع و تنظیم پروژه |
| [create-boxfw](getting-started.md#scaffolding) | ایجاد پروژه جدید با `bunx create-boxfw` |

### 🧱 هسته (Core)

| مستند | توضیحات |
|-------|---------|
| [App](core/app.md) | کلاس اصلی برنامه — مسیرها، میان‌افزار، سرور |
| [Context](core/context.md) | شی درخواست/پاسخ — پارامترها، بدنه، هدرها، پاسخ‌ها |
| [Router](core/router.md) | روتر درخت رادیکس — مسیرهای ایستا، پویا و wildcard |
| [Middleware](core/middleware.md) | پایپلاین میان‌افزار مدل پیازی |

### 📦 بسته‌ها (Packages)

| مستند | توضیحات |
|-------|---------|
| [Validator](packages/validator.md) | اعتبارسنجی درخواست با Zod و استنتاج نوع کامل |
| [Adapters](packages/adapters.md) | اجرا در دو محیط (Bun + Cloudflare Workers) |
| [DB](packages/db.md) | یکپارچه‌سازی Drizzle ORM با اجرای مهاجرت |
| [Auth](packages/auth.md) | احراز هویت JWT (HS256) + نشست |
| [i18n](packages/i18n.md) | بومی‌سازی، RTL، خطاهای دو زبانه |
| [OpenAPI](packages/openapi.md) | تولید خودکار مشخصات OpenAPI 3.0 |
| [Logger](packages/logger.md) | ثبت وقایع ساختاریافته با خروجی pretty/JSON |

### 🛠️ راهنماها

| مستند | توضیحات |
|-------|---------|
| [WebSocket](guides/websocket.md) | ارتباط بلادرنگ با WebSocket |
| [مدیریت خطا](guides/error-handling.md) | هندلرهای خطای سفارشی و خطاهای اعتبارسنجی |
| [تست](guides/testing.md) | تست برنامه‌های Box با Bun test |
| [استقرار](guides/deployment.md) | استقرار در Bun یا Cloudflare Workers |

### 🔬 پیشرفته

| مستند | توضیحات |
|-------|---------|
| [معماری](advanced/architecture.md) | ساختار داخلی فریمورک و تصمیمات طراحی |
| [بنچمارک](advanced/benchmarking.md) | مقایسه عملکرد |

---

## لینک‌های سریع

| اقدام | دستور |
|-------|-------|
| ایجاد پروژه | `bunx create-boxfw` |
| نصب هسته | `bun add boxfw-core` |
| اجرای تست | `bun test` |
| شروع سرور توسعه | `bun run --watch src/index.ts` |

---

## بسته‌ها در یک نگاه

```text
boxfw-core         → روتر، Context، میان‌افزار، App، WebSocket
boxfw-validator    → اعتبارسنجی Zod با استنتاج نوع
boxfw-adapters     → wrapperهای زمان اجرا Bun + Workers
boxfw-db           → Drizzle ORM (SQLite, D1, PG)
boxfw-auth         → JWT (HS256) + نشست کوکی
boxfw-i18n         → تشخیص زبان، RTL، ترجمه
boxfw-openapi      → تولید مشخصات OpenAPI 3.0
boxfw-logger       → ثبت وقایع ساختاریافته (pretty + JSON)
create-boxfw       → CLI ایجاد پروژه
```

---

> 📚 همچنین به [English version](../en/index.md) مراجعه کنید
