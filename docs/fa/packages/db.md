# DB — یکپارچه‌سازی Drizzle ORM

بسته `boxfw-db` یکپارچه‌سازی درجه یک با Drizzle ORM و اجرای مهاجرت برای Bun SQLite، Cloudflare D1 و PostgreSQL را فراهم می‌کند.

## نصب

```bash
bun add boxfw-db drizzle-orm
bun add drizzle-orm/bun-sqlite  # برای SQLite
bun add drizzle-orm/pg           # برای PostgreSQL
```

## شروع سریع

```ts
import { Box } from "boxfw-core";
import { D, createDbCtx, createBunSqlite } from "boxfw-db";
import * as schema from "../drizzle/schema";

const orm = await createBunSqlite({ path: "app.db", schema });
const db = createDbCtx<typeof orm>();

const app = new Box();
app.use(D(orm));

app.get("/users", async (c) => {
  const users = await db(c).select().from(schema.users);
  return c.json(users);
});
```

## فرم‌های تزریق

```ts
// استاتیک
app.use(D(orm));

// کارخانه‌ای (برای D1)
app.use(D((c) => drizzle(c.env("DB"), { schema })));
```

## اجرای مهاجرت

```ts
import { migrate } from "boxfw-db";

await migrate({ driver: "bun-sqlite", db: orm, migrationsFolder: "./drizzle" });
await migrate({ driver: "d1", db: orm, migrationsFolder: "./drizzle" });
await migrate({ driver: "pg", db: orm, migrationsFolder: "./drizzle" });
```

| زمان اجرا | درایور | وضعیت |
|-----------|--------|--------|
| Bun | `bun:sqlite` | ✅ درجه یک |
| Cloudflare Workers | D1 | ✅ درجه یک |
| Bun / Node | PostgreSQL | ✅ پشتیبانی می‌شود |

---

> 📚 [بازگشت به فهرست](../index.md) · [قبلی: Adapters](adapters.md) · [بعدی: Auth](auth.md)
