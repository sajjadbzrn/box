import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import type { ProjectOptions } from "./prompts";
import { c } from "./utils/colors";
import { resolveLatestVersion } from "./utils/npm";
import { createSpinner } from "./utils/spinner";
import { render } from "./utils/templates";

const TEMPLATES_DIR = join(import.meta.dirname, "..", "templates");
const BASE_DIR = join(TEMPLATES_DIR, "base");
const AUTH_DIR = join(TEMPLATES_DIR, "auth");
const DRIZZLE_DIR = join(TEMPLATES_DIR, "drizzle");
const I18N_DIR = join(TEMPLATES_DIR, "i18n");
const WORKERS_DIR = join(TEMPLATES_DIR, "workers");

interface TemplateContext {
  [key: string]: string | boolean;
}

// Color palette consistent with prompts.ts
const PALETTE = {
  primary: "#6366f1",
  secondary: "#06b6d4",
  success: "#22c55e",
  muted: "#6b7280",
  file: "#a78bfa",
  dir: "#06b6d4",
};

const hex = (color: string) => (text: string) => c.hex(color, text);

/**
 * Track the current depth for tree visualization.
 */
let treePrefixes: string[] = [];

function sectionHeader(title: string): void {
  console.log(`\n  ${hex(PALETTE.primary)("┃")} ${c.bold(title)}`);
}

function createFile(path: string): void {
  // Remove project root prefix for display
  const display = path.replace(/\\/g, "/");
  console.log(`  ${hex(PALETTE.primary)("┃")}   ${hex(PALETTE.file)("📄")} ${c.dim(display)}`);
}

export async function checkDirectoryCollision(name: string): Promise<boolean> {
  const dir = join(process.cwd(), name);
  return existsSync(dir);
}

export async function scaffold(opts: ProjectOptions): Promise<void> {
  const dir = join(process.cwd(), opts.name);

  if (existsSync(dir)) {
    if (opts.force) {
      console.log(`  ${c.hex("#eab308", "⚠")} ${c.yellow(`Directory ${c.bold(opts.name)} already exists. Overwriting...`)}`);
    } else {
      console.log(`  ${c.hex("#ef4444", "✗")} ${c.brightRed(`Directory ${opts.name} already exists. Use --force to overwrite.`)}`);
      process.exit(1);
    }
  }

  sectionHeader("Resolving version");
  const spin = createSpinner("Checking latest BoxFW release...", {
    style: "dots",
    color: hex(PALETTE.primary),
  });
  spin.start();
  const boxfwVersion = await resolveLatestVersion();
  spin.succeed(`BoxFW v${boxfwVersion} resolved`);

  sectionHeader("Creating project structure");
  console.log(`  ${hex(PALETTE.primary)("┃")}   ${c.dim(`./${opts.name}/`)}`);

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
  const pkgPath = join(dir, "package.json");
  writeFileSync(pkgPath, genPackageJson(opts, boxfwVersion));
  createFile(relative(process.cwd(), pkgPath));

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

  // Show a nice completion banner
  console.log(`  ${hex(PALETTE.primary)("┃")}`);
  console.log(`  ${hex(PALETTE.primary)("┗" + "━".repeat(40) + "┛")}`);
  console.log(`    ${c.hex(PALETTE.success, "✓")} ${c.bold(c.green(`Project ${c.bold(opts.name)} created successfully!`))}`);
  console.log("");

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
    createFile(relative(process.cwd(), finalDest));
  }
}

function genPackageJson(opts: ProjectOptions, version: string): string {
  const deps: Record<string, string> = {
    "boxfw-core": `^${version}`,
  };

  if (opts.orm === "drizzle") {
    deps["boxfw-db"] = `^${version}`;
    deps["drizzle-orm"] = "^0.36";
    deps["drizzle-kit"] = "^0.30";
  }
  if (opts.i18n) deps["boxfw-i18n"] = `^${version}`;
  if (opts.auth) deps["boxfw-auth"] = `^${version}`;
  if (opts.logger) deps["boxfw-logger"] = `^${version}`;
  if (opts.validator) deps["boxfw-validator"] = `^${version}`;
  if (opts.validator) deps.zod = "^3.23.0";
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

  scripts.typecheck = "tsc --noEmit";
  scripts["boxfw:update"] = "bunx npm-check-updates --target latest --filter /^boxfw-/ -u && bun install";

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
        typescript: "^5.7.0",
      },
    },
    null,
    2,
  );
}

function printNextSteps(opts: ProjectOptions): void {
  const h = (s: string) => c.hex(PALETTE.primary, s);
  const s = (s: string) => c.hex(PALETTE.secondary, s);
  const g = (s: string) => c.hex(PALETTE.success, s);

  console.log(`  ${c.bold("Next steps:")}\n`);
  console.log(`    ${h("❯")}  ${s("cd")} ${c.bold(opts.name)}`);

  if (!opts.skipInstall) {
    console.log(`    ${h("❯")}  ${s("bun")} install`);
  }

  console.log(`    ${h("❯")}  ${s("bun")} dev`);

  if (opts.initGit) {
    console.log(`    ${h("❯")}  ${c.dim('git init && git add -A && git commit -m "initial commit"')}`);
  }

  console.log(`\n  ${c.dim("Happy coding with Box! 🚀")}`);
}

