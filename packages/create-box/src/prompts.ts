import { join } from "node:path";
import { readFileSync } from "node:fs";
import { scaffold, checkDirectoryCollision } from "./scaffold";
import { c } from "./utils/colors";
import { validateProjectName } from "./utils/validation";
import { createSpinner } from "./utils/spinner";

export interface ProjectOptions {
  name: string;
  runtime: "bun" | "workers" | "both";
  orm: "drizzle" | "none";
  i18n: boolean;
  auth: boolean;
  logger: boolean;
  validator: boolean;
  openapi: boolean;
  websocket: boolean;
  initGit: boolean;
  skipInstall: boolean;
  force: boolean;
  yes: boolean;
}

const BANNER = `
${c.blue("┌──────────────────────────────────────────┐")}
${c.blue("│")}  ${c.bold("Box")} ${c.dim("— batteries-included backend framework")}  ${c.blue("│")}
${c.blue("└──────────────────────────────────────────┘")}
`;

export function parseCliArgs(args: string[]): Partial<ProjectOptions> {
  const opts: Partial<ProjectOptions> = {};
  let i = 0;

  while (i < args.length) {
    const arg = args[i]!;

    if (arg === "--yes" || arg === "-y") {
      opts.yes = true;
    } else if (arg === "--skip-install") {
      opts.skipInstall = true;
    } else if (arg === "--skip-git") {
      opts.initGit = false;
    } else if (arg === "--force" || arg === "-f") {
      opts.force = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--version" || arg === "-v") {
      printVersion();
      process.exit(0);
    } else if (arg === "--name") {
      opts.name = args[++i];
    } else if (arg === "--runtime") {
      const v = args[++i];
      opts.runtime = validateChoice<"bun" | "workers" | "both">(v, ["bun", "workers", "both"], "bun");
    } else if (arg === "--orm") {
      const v = args[++i];
      opts.orm = validateChoice<"drizzle" | "none">(v, ["drizzle", "none"], "drizzle");
    } else if (arg === "--i18n") {
      opts.i18n = parseBool(args[++i]);
    } else if (arg === "--auth") {
      opts.auth = parseBool(args[++i]);
    } else if (arg === "--logger") {
      opts.logger = parseBool(args[++i]);
    } else if (arg === "--validator") {
      opts.validator = parseBool(args[++i]);
    } else if (arg === "--openapi") {
      opts.openapi = parseBool(args[++i]);
    } else if (arg === "--websocket") {
      opts.websocket = parseBool(args[++i]);
    } else if (arg.startsWith("-")) {
      console.log(c.error(`Unknown flag: ${arg}`));
      console.log(`Run ${c.cyan("create-boxfw --help")} for usage.`);
      process.exit(1);
    } else {
      opts.name = arg; // positional: project name
    }
    i++;
  }

  return opts;
}

function parseBool(val: string | undefined): boolean {
  if (!val) return true;
  const lower = val.toLowerCase();
  if (lower === "true" || lower === "yes" || lower === "1" || lower === "y") return true;
  if (lower === "false" || lower === "no" || lower === "0" || lower === "n") return false;
  return true;
}

function printHelp(): void {
  console.log(BANNER);
  console.log(`Create a new Box Framework project.\n`);
  console.log(c.bold("Usage:"));
  console.log(`  ${c.cyan("bunx create-boxfw")} [project-name] [flags]\n`);
  console.log(c.bold("Flags:"));
  console.log(`  --name <name>         Project name (default: my-box-app)`);
  console.log(`  --runtime <target>    bun | workers | both (default: bun)`);
  console.log(`  --orm <choice>        drizzle | none (default: drizzle)`);
  console.log(`  --i18n <bool>         Include i18n/RTL support (default: yes)`);
  console.log(`  --auth <bool>         Include auth module (default: no)`);
  console.log(`  --logger <bool>       Include structured logger (default: yes)`);
  console.log(`  --validator <bool>    Include Zod validator (default: yes)`);
  console.log(`  --openapi <bool>      Include OpenAPI spec gen (default: yes)`);
  console.log(`  --websocket <bool>    Include WebSocket demo (default: no)`);
  console.log(`  --yes, -y             Skip prompts, use defaults`);
  console.log(`  --skip-install        Don't suggest bun install`);
  console.log(`  --skip-git            Don't suggest git init`);
  console.log(`  --force, -f           Overwrite existing directory`);
  console.log(`  --help, -h            Show this help`);
  console.log(`  --version, -v         Show version\n`);
  console.log(c.dim("Box Framework — https://github.com/sajjadbzrn/box"));
}

function printVersion(): void {
  try {
    const pkgPath = join(import.meta.dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
    console.log(`create-boxfw v${pkg.version}`);
  } catch {
    console.log("create-boxfw");
  }
}

const DEFAULTS: ProjectOptions = {
  name: "my-box-app",
  runtime: "bun",
  orm: "drizzle",
  i18n: true,
  auth: false,
  logger: true,
  validator: true,
  openapi: true,
  websocket: false,
  initGit: true,
  skipInstall: false,
  force: false,
  yes: false,
};

export async function main(cliArgs: Partial<ProjectOptions> = {}): Promise<void> {
  if (!cliArgs.yes) {
    console.log(BANNER);
  }

  const options: ProjectOptions = { ...DEFAULTS, ...cliArgs };

  // Interactive prompts if not --yes
  if (!options.yes) {
    await promptUser(options);
  }

  // Validate
  const nameErr = validateProjectName(options.name);
  if (nameErr) {
    console.log(c.error(nameErr));
    process.exit(1);
  }

  // Check directory collision
  if (!options.force && await checkDirectoryCollision(options.name)) {
    await promptOverwrite(options);
  }

  // Confirmation
  if (!options.yes) {
    printSummary(options);
    const proceed = await ask("Proceed with these options? (yes / no)", "yes");
    if (proceed.toLowerCase() !== "yes" && proceed.toLowerCase() !== "y") {
      console.log(c.yellow("Aborted."));
      process.exit(0);
    }
    console.log("");
  }

  await scaffold(options);

  // Post-scaffold: offer to install
  if (!options.skipInstall && !options.yes) {
    await promptInstall(options);
  }
}

async function promptUser(opts: ProjectOptions): Promise<void> {
  opts.name = await ask("Project name:", opts.name);

  opts.runtime = validateChoice<"bun" | "workers" | "both">(
    await ask("Runtime target (bun / workers / both):", opts.runtime),
    ["bun", "workers", "both"],
    "bun",
  );

  opts.orm = validateChoice<"drizzle" | "none">(
    await ask("Include ORM (drizzle / none):", opts.orm),
    ["drizzle", "none"],
    "drizzle",
  );

  opts.validator = (await ask("Include Zod validator? (yes / no):", boolStr(opts.validator))).toLowerCase() === "yes";
  opts.i18n = (await ask("Include i18n/RTL support? (yes / no):", boolStr(opts.i18n))).toLowerCase() === "yes";
  opts.auth = (await ask("Include auth module? (yes / no):", boolStr(opts.auth))).toLowerCase() === "yes";
  opts.logger = (await ask("Include structured logger? (yes / no):", boolStr(opts.logger))).toLowerCase() === "yes";
  opts.openapi = (await ask("Include OpenAPI spec gen? (yes / no):", boolStr(opts.openapi))).toLowerCase() === "yes";
  opts.websocket = (await ask("Include WebSocket demo? (yes / no):", boolStr(opts.websocket))).toLowerCase() === "yes";
  opts.initGit = (await ask("Initialize git repository? (yes / no):", boolStr(opts.initGit))).toLowerCase() === "yes";
}

async function promptOverwrite(opts: ProjectOptions): Promise<void> {
  const answer = await ask(
    `${c.yellow(`Directory ${opts.name} already exists. Overwrite? (yes / no)`)}`,
    "no",
  );
  if (answer.toLowerCase() !== "yes" && answer.toLowerCase() !== "y") {
    console.log(c.yellow("Aborted."));
    process.exit(0);
  }
  opts.force = true;
}

async function promptInstall(opts: ProjectOptions): Promise<void> {
  const answer = await ask("Run `bun install` now? (yes / no)", "yes");
  if (answer.toLowerCase() === "yes" || answer.toLowerCase() === "y") {
    const spin = createSpinner("Installing dependencies...");
    spin.start();
    const proc = Bun.spawn(["bun", "install"], { cwd: join(process.cwd(), opts.name), stdio: ["ignore", "pipe", "pipe"] });
    const exitCode = await proc.exited;
    spin.stop();
    if (exitCode === 0) {
      console.log(c.success("Dependencies installed."));
    } else {
      const stderr = await new Response(proc.stderr).text();
      console.log(c.error(`Install failed: ${stderr}`));
    }
    console.log("");
  }
}

function printSummary(opts: ProjectOptions): void {
  console.log(c.dim("\n───────────────────────────────────────────"));
  console.log(c.bold("Project Summary:"));
  console.log(`  Name:       ${c.cyan(opts.name)}`);
  console.log(`  Runtime:    ${c.cyan(opts.runtime)}`);
  console.log(`  ORM:        ${c.cyan(opts.orm)}`);
  console.log(`  Validator:  ${opts.validator ? c.green("yes") : c.dim("no")}`);
  console.log(`  i18n:       ${opts.i18n ? c.green("yes") : c.dim("no")}`);
  console.log(`  Auth:       ${opts.auth ? c.green("yes") : c.dim("no")}`);
  console.log(`  Logger:     ${opts.logger ? c.green("yes") : c.dim("no")}`);
  console.log(`  OpenAPI:    ${opts.openapi ? c.green("yes") : c.dim("no")}`);
  console.log(`  WebSocket:  ${opts.websocket ? c.green("yes") : c.dim("no")}`);
  console.log(`  Git Init:   ${opts.initGit ? c.green("yes") : c.dim("no")}`);
  console.log(c.dim("───────────────────────────────────────────"));
}

function ask(question: string, defaultVal: string): Promise<string> {
  process.stdout.write(`${c.dim("?")} ${question} ${c.dim(`[${defaultVal}]`)} `);

  return readOneLine().then((line) => {
    const trimmed = line.trim();
    return trimmed || defaultVal;
  });
}

function readOneLine(): Promise<string> {
  return new Promise<string>((resolve) => {
    let buf = "";
    const onData = (chunk: Buffer | string) => {
      buf += typeof chunk === "string" ? chunk : chunk.toString();
      const idx = buf.indexOf("\n");
      if (idx >= 0) {
        process.stdin.off("data", onData);
        const spare = buf.slice(idx + 1);
        if (spare.length > 0) {
          addToBuffer(spare);
        }
        resolve(buf.slice(0, idx));
      }
    };
    process.stdin.on("data", onData);
  });
}

function addToBuffer(text: string) {
  askBuffer.push(text);
  if (!processingBuffer) drainBuffer();
}

const askBuffer: string[] = [];
let processingBuffer = false;

function drainBuffer() {
  processingBuffer = true;
  // Remaining piped data is consumed by readOneLine which drains from the data event.
  // The buffer is there for overflow between prompt reads.
  processingBuffer = false;
}

function boolStr(b: boolean): string {
  return b ? "yes" : "no";
}

function validateChoice<T extends string>(
  value: string | undefined,
  valid: T[],
  fallback: T,
): T {
  if (value && valid.includes(value as T)) return value as T;
  return fallback;
}
