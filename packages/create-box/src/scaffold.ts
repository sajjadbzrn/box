import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ProjectOptions } from "./prompts";

export async function scaffold(opts: ProjectOptions): Promise<void> {
  const dir = join(process.cwd(), opts.name);
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, "src"), { recursive: true });

  // package.json
  writeFileSync(join(dir, "package.json"), genPackageJson(opts));

  // tsconfig.json
  writeFileSync(join(dir, "tsconfig.json"), genTsConfig());

  // src/index.ts
  writeFileSync(join(dir, "src", "index.ts"), genMainFile(opts));

  // Worker entry (if applicable)
  if (opts.runtime === "workers" || opts.runtime === "both") {
    writeFileSync(join(dir, "src", "worker-entry.ts"), genWorkerEntry(opts));
  }

  // i18n locale files
  if (opts.i18n) {
    mkdirSync(join(dir, "locales"), { recursive: true });
    writeFileSync(
      join(dir, "locales", "en.json"),
      JSON.stringify({ hello: "Hello, Box!", not_found: "Not Found", error: "Internal Error" }, null, 2),
    );
    writeFileSync(
      join(dir, "locales", "fa.json"),
      JSON.stringify({ hello: "سلام، باکس!", not_found: "پیدا نشد", error: "خطای داخلی" }, null, 2),
    );
  }

  // Drizzle schema
  if (opts.orm === "drizzle") {
    mkdirSync(join(dir, "drizzle"), { recursive: true });
    writeFileSync(
      join(dir, "drizzle", "schema.ts"),
      `import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: text("created_at").notNull(),
});`,
    );

    writeFileSync(
      join(dir, "src", "db.ts"),
      `import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { D, createDbCtx } from "boxfw-db";
import * as schema from "../drizzle/schema";

const sqlite = new Database("app.db");
export const db = drizzle(sqlite, { schema });
export const typedDb = createDbCtx<typeof db>();

export { D };`,
    );
  }

  console.log(`  Created ${opts.name}/`);
}

function genPackageJson(opts: ProjectOptions): string {
  const deps: Record<string, string> = {
    "boxfw-core": "^0.2.1",
  };
  if (opts.orm === "drizzle") {
    deps["boxfw-db"] = "^0.2.1";
    deps["drizzle-orm"] = "^0.36";
  }
  if (opts.i18n) deps["boxfw-i18n"] = "^0.2.1";
  if (opts.auth) deps["boxfw-auth"] = "^0.2.1";
  if (opts.logger) deps["boxfw-logger"] = "^0.2.1";

  if (opts.runtime === "workers" || opts.runtime === "both") {
    deps["boxfw-adapters"] = "^0.2.1";
  }

  const scripts: Record<string, string> = {
    dev: "bun run --watch src/index.ts",
    test: "bun test",
  };
  if (opts.orm === "drizzle") {
    scripts["db:generate"] = "drizzle-kit generate";
    scripts["db:migrate"] = "bun run src/migrate.ts";
  }

  // Keep boxfw packages always at the latest version
  scripts["boxfw:update"] =
    "bunx npm-check-updates --target latest --filter /^boxfw-/ -u && bun install";

  return JSON.stringify(
    {
      name: opts.name,
      version: "0.0.0",
      private: true,
      type: "module",
      scripts,
      dependencies: deps,
      devDependencies: {
        "bun-types": "latest",
      },
    },
    null,
    2,
  );
}

function genTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ESNext",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        types: ["bun-types"],
      },
    },
    null,
    2,
  );
}

function genMainFile(opts: ProjectOptions): string {
  let imports = 'import { Box } from "boxfw-core";\n';
  if (opts.logger) imports += 'import { createLogger, requestLogger } from "boxfw-logger";\n';
  if (opts.i18n) imports += 'import { localeDetect, t, rtlMeta } from "boxfw-i18n";\n';
  if (opts.orm === "drizzle") imports += 'import { D, db, typedDb } from "./db";\n';
  if (opts.orm === "drizzle") imports += 'import * as schema from "../drizzle/schema";\n';

  let body = "\nconst app = new Box();\n";

  if (opts.logger) {
    body += `\n// Structured request logging
const log = createLogger({ level: "debug" });
app.use(requestLogger({ logger: log }));
`;
  }

  if (opts.i18n) {
    body += `
// Locale detection from Accept-Language header
app.use(localeDetect({
  default: "en",
  supported: ["en", "fa"],
}));
`;
  }

  if (opts.orm === "drizzle") {
    body += `\n// Drizzle ORM middleware
app.use(D(db));
`;
  }

  body += `
// Routes
app.get("/", (c) => {
  return c.json({
    message: "Hello, Box!",
    project: "${opts.name}",
    runtime: "${opts.runtime}",`;
  if (opts.i18n) {
    body += `    locale: c.locale,
    dir: rtlMeta(c.locale).dir,`;
  }
  body += `
  });
});`;

  if (opts.orm === "drizzle") {
    body += `

// Drizzle CRUD example
app.get("/users", async (c) => {
  const users = await typedDb(c).select().from(schema.users);
  return c.json(users);
});
`;
  }

  // Server start — conditional per runtime target
  if (opts.runtime !== "workers") {
    if (opts.logger) {
      body += `

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen({ port });
log.info(\`Server running at http://localhost:\${port}\`);
`;
    } else {
      body += `

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen({ port });
console.log(\`Server running at http://localhost:\${port}\`);
`;
    }
  }

  return imports + body;
}

function genWorkerEntry(opts: ProjectOptions): string {
  let code = `import { Box } from "boxfw-core";
import { workerEnv } from "boxfw-adapters";
const app = new Box();
app.get("/", (c) => c.json({ message: "Hello from Cloudflare Worker!" }));

export default {
  async fetch(request: Request, env: Record<string, unknown>) {
    app.setEnv(workerEnv(env));
    return app.fetch(request);
  },
};
`;
  return code;
}
