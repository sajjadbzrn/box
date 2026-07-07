import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import type { ProjectOptions } from "./prompts";
import { render } from "./utils/templates";
import { resolveLatestVersion } from "./utils/npm";
import { c } from "./utils/colors";
import { createSpinner } from "./utils/spinner";

const TEMPLATES_DIR = join(import.meta.dirname, "..", "templates");
const BASE_DIR = join(TEMPLATES_DIR, "base");
const AUTH_DIR = join(TEMPLATES_DIR, "auth");
const DRIZZLE_DIR = join(TEMPLATES_DIR, "drizzle");
const I18N_DIR = join(TEMPLATES_DIR, "i18n");
const WORKERS_DIR = join(TEMPLATES_DIR, "workers");

interface TemplateContext {
  [key: string]: string | boolean;
}

export async function checkDirectoryCollision(name: string): Promise<boolean> {
  const dir = join(process.cwd(), name);
  return existsSync(dir);
}

export async function scaffold(opts: ProjectOptions): Promise<void> {
  const dir = join(process.cwd(), opts.name);

  if (existsSync(dir)) {
    if (opts.force) {
      console.log(c.warn(`Directory ${opts.name} already exists. Overwriting...`));
    } else {
      console.log(c.error(`Directory ${opts.name} already exists. Use --force to overwrite.`));
      process.exit(1);
    }
  }

  const spin = createSpinner("Resolving latest BoxFW version...");
  spin.start();
  const boxfwVersion = await resolveLatestVersion();
  spin.succeed(`Resolved BoxFW v${boxfwVersion}`);

  console.log(c.cyan(`\nCreating project in ./${opts.name}/\n`));

  mkdirSync(dir, { recursive: true });

  const isBunRuntime = opts.runtime !== "workers";
  const isWorkerRuntime = opts.runtime !== "bun";

  const ctx: TemplateContext = {
    projectName: opts.name,
    boxfwVersion,
    hasDrizzle: opts.orm === "drizzle",
    hasI18n: opts.i18n,
    hasAuth: opts.auth,
    hasLogger: opts.logger,
    hasValidator: opts.validator,
    hasOpenapi: opts.openapi,
    hasWebsocket: opts.websocket,
    isBunRuntime,
    isWorkerRuntime,
    hasCloudflare: isWorkerRuntime,
    hasTest: true,
    hasScripts: true,
    scripts: "",
    runtime: opts.runtime,
    types: '"bun-types"',
    compatDate: new Date().toISOString().split("T")[0] ?? "",
  };

  // ---- Base files ----
  copyDir(BASE_DIR, dir, ctx);

  // ---- package.json (generated in code) ----
  writeFileSync(join(dir, "package.json"), genPackageJson(opts, boxfwVersion));

  // ---- src/index.ts (generated in code for complex conditionals) ----
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "index.ts"), genMainFile(opts, boxfwVersion));

  // ---- Drizzle ----
  if (opts.orm === "drizzle") {
    copyDir(DRIZZLE_DIR, dir, ctx);
  }

  // ---- Auth ----
  if (opts.auth) {
    copyDir(AUTH_DIR, dir, ctx);
  }

  // ---- i18n ----
  if (opts.i18n) {
    copyDir(I18N_DIR, dir, ctx);
  }

  // ---- Workers ----
  if (isWorkerRuntime) {
    copyDir(WORKERS_DIR, dir, ctx);
  }

  console.log(c.green(`\n${c.bold("Done!")} Project ${c.bold(opts.name)} created successfully.\n`));

  // Post-scaffold instructions
  printNextSteps(opts);
}

function copyDir(src: string, dest: string, ctx: TemplateContext): void {
  if (!existsSync(src)) return;

  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const relPath = relative(src, srcPath);
    const destPath = join(dest, relPath);

    if (statSync(srcPath).isDirectory()) {
      mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath, ctx);
      continue;
    }

    const isHbs = entry.endsWith(".hbs");
    const finalDest = isHbs ? destPath.replace(/\.hbs$/, "") : destPath;

    mkdirSync(dirname(finalDest), { recursive: true });

    const content = readFileSync(srcPath, "utf-8");
    const output = isHbs ? render(content, ctx) : content;

    writeFileSync(finalDest, output);
    console.log(`  ${c.dim("+")} ${relative(process.cwd(), finalDest)}`);
  }
}

function genPackageJson(opts: ProjectOptions, version: string): string {
  const deps: Record<string, string> = {
    "boxfw-core": `^${version}`,
  };

  if (opts.orm === "drizzle") {
    deps["boxfw-db"] = `^${version}`;
    deps["drizzle-orm"] = "^0.36";
  }
  if (opts.i18n) deps["boxfw-i18n"] = `^${version}`;
  if (opts.auth) deps["boxfw-auth"] = `^${version}`;
  if (opts.logger) deps["boxfw-logger"] = `^${version}`;
  if (opts.validator) deps["boxfw-validator"] = `^${version}`;
  if (opts.validator) deps["zod"] = "^3.23.0";
  if (opts.openapi) deps["boxfw-openapi"] = `^${version}`;

  if (opts.runtime !== "bun") {
    deps["boxfw-adapters"] = `^${version}`;
  }

  const scripts: Record<string, string> = {
    dev: "bun run --watch src/index.ts",
    test: "bun test",
  };

  if (opts.orm === "drizzle") {
    scripts["db:generate"] = "drizzle-kit generate";
    scripts["db:migrate"] = "bun run src/migrate.ts";
  }

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
        "bun-types": "^1.3.0",
      },
    },
    null,
    2,
  );
}

function genMainFile(opts: ProjectOptions, version: string): string {
  const lines: string[] = [];

  // Imports
  lines.push(`import { Box, cors } from "boxfw-core";`);

  if (opts.logger) {
    lines.push(`import { createLogger, requestLogger } from "boxfw-logger";`);
  }
  if (opts.i18n) {
    lines.push(`import { localeDetect, t, rtlMeta } from "boxfw-i18n";`);
  }
  if (opts.validator) {
    lines.push(`import { v, z } from "boxfw-validator";`);
  }
  if (opts.openapi) {
    lines.push(`import { openapi } from "boxfw-openapi";`);
  }
  if (opts.orm === "drizzle") {
    lines.push(`import { D, typedDb } from "./db";`);
    lines.push(`import { db } from "./db";`);
    lines.push(`import * as schema from "../drizzle/schema";`);
  }
  if (opts.auth) {
    lines.push(`import { jwt } from "boxfw-auth";`);
    lines.push(`import { registerAuthRoutes } from "./auth/routes";`);
  }

  lines.push("");
  lines.push("const app = new Box();");
  lines.push("");

  // Logger
  if (opts.logger) {
    lines.push(`const log = createLogger({ level: "debug", name: "${opts.name}" });`);
    lines.push(`app.use(requestLogger({ logger: log }));`);
    lines.push("");
  }

  // CORS
  lines.push(`app.use(cors({ origin: "*" }));`);
  lines.push("");

  // i18n
  if (opts.i18n) {
    lines.push(`app.use(localeDetect({`);
    lines.push(`  default: "en",`);
    lines.push(`  supported: ["en", "fa"],`);
    lines.push(`}));`);
    lines.push("");
  }

  // DB
  if (opts.orm === "drizzle") {
    lines.push(`app.use(D(db));`);
    lines.push("");
  }

  // Auth
  if (opts.auth) {
    lines.push(`app.use(jwt({`);
    lines.push(`  secret: process.env.JWT_SECRET || "dev-secret-change-me",`);
    lines.push(`  optional: true,`);
    lines.push(`}));`);
    lines.push("");
  }

  // OpenAPI
  if (opts.openapi) {
    lines.push(`openapi(app, {`);
    lines.push(`  info: {`);
    lines.push(`    title: "${opts.name}",`);
    lines.push(`    version: "0.0.0",`);
    lines.push(`    description: "${opts.name} API",`);
    lines.push(`  },`);
    lines.push(`  path: "/openapi.json",`);
    lines.push(`});`);
    lines.push("");
  }

  // Error handlers
  lines.push(`app.notFound((c) => {`);
  lines.push(`  return c.json({ error: "Not Found" }, 404);`);
  lines.push(`});`);
  lines.push("");
  lines.push(`app.onError((c, err) => {`);
  if (opts.logger) {
    lines.push(`  log.error("Unhandled error", { error: err.message });`);
  } else {
    lines.push(`  console.error(err);`);
  }
  lines.push(`  return c.json({ error: "Internal Server Error" }, 500);`);
  lines.push(`});`);
  lines.push("");

  // Routes
  lines.push(`// Routes`);
  lines.push(`app.get("/", (c) => {`);
  const homeFields: string[] = [];
  homeFields.push(`    message: "Hello, Box!",`);
  homeFields.push(`    project: "${opts.name}",`);
  homeFields.push(`    runtime: "${opts.runtime}",`);
  if (opts.i18n) {
    homeFields.push(`    locale: c.locale,`);
    homeFields.push(`    dir: rtlMeta(c.locale).dir,`);
  }
  lines.push(`  return c.json({`);
  lines.push(homeFields.join("\n"));
  lines.push(`  });`);
  lines.push(`});`);
  lines.push("");

  // Validator demo
  if (opts.validator) {
    lines.push(`// Zod validation example`);
    lines.push(`const helloQuery = z.object({`);
    lines.push(`  name: z.string().optional().default("World"),`);
    lines.push(`});`);
    lines.push("");
    lines.push(`app.get("/hello", v({ query: helloQuery }, (c) => {`);
    lines.push(`  return c.json({ message: \`Hello, \${c.validated.query.name}!\` });`);
    lines.push(`}));`);
    lines.push("");
  }

  // Drizzle CRUD demo
  if (opts.orm === "drizzle") {
    lines.push(`// Drizzle CRUD example`);
    lines.push(`app.get("/users", async (c) => {`);
    lines.push(`  const users = await typedDb(c).select().from(schema.users);`);
    lines.push(`  return c.json(users);`);
    lines.push(`});`);
    lines.push("");
  }

  // Auth routes
  if (opts.auth) {
    lines.push(`// Auth routes`);
    lines.push(`registerAuthRoutes(app);`);
    lines.push("");
  }

  // Server start (only for Bun runtime)
  if (opts.runtime !== "workers") {
    lines.push(`const port = process.env.PORT ? Number(process.env.PORT) : 3000;`);
    lines.push(`app.listen({ port });`);
    if (opts.logger) {
      lines.push(`log.info(\`Server running at http://localhost:\${port}\`);`);
    } else {
      lines.push(`console.log(\`Server running at http://localhost:\${port}\`);`);
    }
  }

  lines.push("");
  lines.push("export { app };");

  return lines.join("\n") + "\n";
}

function printNextSteps(opts: ProjectOptions): void {
  console.log(c.bold("Next steps:"));
  console.log(`  ${c.cyan("cd")} ${opts.name}`);

  if (!opts.skipInstall) {
    console.log(`  ${c.cyan("bun")} install`);
  }

  console.log(`  ${c.cyan("bun")} dev`);
  console.log("");

  if (opts.initGit) {
    console.log(c.dim("Tip: Run `git init && git add -A && git commit -m \"initial commit\"` to start version control."));
    console.log("");
  }
}
