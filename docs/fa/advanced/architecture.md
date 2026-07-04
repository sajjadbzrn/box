# معماری — ساختار داخلی فریمورک

## طراحی سطح بالا

```text
┌──────────────────────────────────────────────┐
│                  App (Box)                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Router   │  │Middleware│  │  WebSocket  │ │
│  └──────────┘  └──────────┘  └────────────┘ │
│  ┌──────────────────────────────────────────┐│
│  │           Context (Req/Res)              ││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
         │                            │
    Bun.serve()              Cloudflare Worker
```

## گراف وابستگی بسته‌ها

```text
boxfw-core ─────────────────────────────────────┐
    │                                           │
    ├── boxfw-validator                         │
    ├── boxfw-adapters                          │
    ├── boxfw-db                                │
    ├── boxfw-auth                              │
    ├── boxfw-i18n                              │
    ├── boxfw-openapi                           │
    ├── boxfw-logger                            │
    └── create-boxfw                            │
```

همه بسته‌ها به `boxfw-core` وابسته هستند. وابستگی چرخه‌ای وجود ندارد.

## چرخه عمر درخواست

```text
1. درخواست وارد می‌شود
2. App.fetch(request)
3. تجزیه URL، استخراج متد و مسیر
4. Router.lookup(method, path)
   ├── پیمایش درخت رادیکس
   └── بازگرداندن { handler, params } یا null
5. ایجاد Context(request, params)
6. کامپایل پایپلاین میان‌افزار
7. اجرای زنجیره میان‌افزار (مدل پیازی)
8. بازگرداندن Response
```

## معماری روتر

درخت رادیکس یک trie فشرده است که پیشوندهای مشترک URL را در گره‌های واحد ادغام می‌کند:

```text
/users
/users/:id
/users/:id/posts → /users/ → :id/ → posts
```

## معماری دو محیطی

رابط `EnvStore` تفاوت‌های زمان اجرا را انتزاع می‌کند:

```ts
interface EnvStore { get(key: string): unknown; }

// Bun: bunEnv() → از process.env می‌خواند
// Workers: workerEnv(bindings) → از env argument می‌خواند
```

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: استقرار](../guides/deployment.md) · [بعدی: بنچمارک](benchmarking.md)
