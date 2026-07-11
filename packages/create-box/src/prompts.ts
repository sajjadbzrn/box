import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkDirectoryCollision, scaffold } from "./scaffold";
import { c } from "./utils/colors";
import { createSpinner } from "./utils/spinner";
import { validateProjectName } from "./utils/validation";

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

// ═══════════════════════════════════════════════════════════════════════════
//  BEAUTIFUL ASCII ART LOGO
// ═══════════════════════════════════════════════════════════════════════════

const LOGO = `
${c.gradient("  ╔══════════════════════════════════════════════╗", "#6366f1", "#06b6d4")}
${c.gradient("  ║", "#6366f1", "#06b6d4")}          ${c.bold(c.hex("#a78bfa", "B"))}${c.bold(c.hex("#818cf8", "O"))}${c.bold(c.hex("#6366f1", "X"))} ${c.hex("#06b6d4", "Framework")}          ${c.gradient("║", "#6366f1", "#06b6d4")}
${c.gradient("  ╚══════════════════════════════════════════════╝", "#6366f1", "#06b6d4")}
`;

/** Color palette for the Box brand. */
const PALETTE = {
  primary: "#6366f1",
  secondary: "#06b6d4",
  accent: "#a78bfa",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
  muted: "#6b7280",
};

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
  console.log(LOGO);
  console.log(`  ${c.bold("Create a new Box Framework project.")}\n`);
  console.log(`  ${c.bold(c.hex(PALETTE.primary, "Usage:"))}`);
  console.log(`    ${c.cyan("bunx create-boxfw")} ${c.dim("[project-name]")} ${c.dim("[flags]")}\n`);
  console.log(`  ${c.bold(c.hex(PALETTE.secondary, "Flags:"))}`);
  console.log(`    --name <name>         Project name ${c.dim("(default: my-box-app)")}`);
  console.log(`    --runtime <target>    ${c.cyan("bun")} | ${c.cyan("workers")} | ${c.cyan("both")} ${c.dim("(default: bun)")}`);
  console.log(`    --orm <choice>        ${c.cyan("drizzle")} | ${c.cyan("none")} ${c.dim("(default: drizzle)")}`);
  console.log(`    --i18n <bool>         Include i18n/RTL support ${c.dim("(default: yes)")}`);
  console.log(`    --auth <bool>         Include auth module ${c.dim("(default: no)")}`);
  console.log(`    --logger <bool>       Include structured logger ${c.dim("(default: yes)")}`);
  console.log(`    --validator <bool>    Include Zod validator ${c.dim("(default: yes)")}`);
  console.log(`    --openapi <bool>      Include OpenAPI spec gen ${c.dim("(default: yes)")}`);
  console.log(`    --websocket <bool>    Include WebSocket demo ${c.dim("(default: no)")}`);
  console.log(`    --yes, -y             Skip prompts, use defaults`);
  console.log(`    --skip-install        Don't suggest bun install`);
  console.log(`    --skip-git            Don't suggest git init`);
  console.log(`    --force, -f           Overwrite existing directory`);
  console.log(`    --help, -h            Show this help`);
  console.log(`    --version, -v         Show version\n`);
  console.log(`  ${c.dim(c.hex(PALETTE.muted, "Box Framework — https://github.com/sajjadbzrn/box"))}`);
}

function printVersion(): void {
  try {
    const pkgPath = join(import.meta.dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      version: string;
    };
    console.log(`${c.hex(PALETTE.primary, "create-boxfw")} v${c.bold(pkg.version)}`);
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
    console.log(LOGO);
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
  if (!options.force && (await checkDirectoryCollision(options.name))) {
    await promptOverwrite(options);
  }

  // Confirmation
  if (!options.yes) {
    printSummary(options);
    const proceed = await confirm("Proceed with these options?", true);
    if (!proceed) {
      console.log(`  ${c.hex(PALETTE.warning, "⚠")} ${c.yellow("Aborted.")}`);
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
  opts.name = await textInput("Project name", opts.name);

  opts.runtime = await select<"bun" | "workers" | "both">(
    "Runtime target",
    [
      { value: "bun", label: "Bun", hint: "Native performance, WebSocket, SQLite" },
      { value: "workers", label: "Cloudflare Workers", hint: "Edge-deployed, D1, KV" },
      { value: "both", label: "Both", hint: "Shared code, dual entry points" },
    ],
    opts.runtime,
  );

  opts.orm = await select<"drizzle" | "none">(
    "Database ORM",
    [
      { value: "drizzle", label: "Drizzle ORM", hint: "Type-safe SQL, SQLite/D1/PG support" },
      { value: "none", label: "None", hint: "Skip database setup" },
    ],
    opts.orm,
  );

  opts.validator = await confirm("Include Zod validation?", opts.validator);
  opts.i18n = await confirm("Include i18n / RTL support?", opts.i18n);
  opts.auth = await confirm("Include authentication module?", opts.auth);
  opts.logger = await confirm("Include structured logging?", opts.logger);
  opts.openapi = await confirm("Include OpenAPI spec generation?", opts.openapi);
  opts.websocket = await confirm("Include WebSocket routes?", opts.websocket);
  opts.initGit = await confirm("Initialize git repository?", opts.initGit);
}

async function promptOverwrite(opts: ProjectOptions): Promise<void> {
  const proceed = await confirm(
    `${c.hex(PALETTE.warning, `Directory ${c.bold(opts.name)} already exists. Overwrite?`)}`,
    false,
  );
  if (!proceed) {
    console.log(`  ${c.hex(PALETTE.warning, "⚠")} ${c.yellow("Aborted.")}`);
    process.exit(0);
  }
  opts.force = true;
}

async function promptInstall(opts: ProjectOptions): Promise<void> {
  const proceed = await confirm(`Run ${c.cyan("bun install")} now?`, true);
  if (proceed) {
    const spin = createSpinner("Installing dependencies...", { style: "bounce", color: c.hex.bind(null, PALETTE.primary) });
    spin.start();
    const proc = Bun.spawn(["bun", "install"], {
      cwd: join(process.cwd(), opts.name),
      stdio: ["ignore", "pipe", "pipe"],
    });
    const exitCode = await proc.exited;
    spin.stop();
    if (exitCode === 0) {
      console.log(`  ${c.hex(PALETTE.success, "✓")} ${c.green("Dependencies installed.")}`);
    } else {
      const stderr = await new Response(proc.stderr).text();
      console.log(c.error(`Install failed: ${stderr}`));
    }
    console.log("");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  BEAUTIFUL SUMMARY TABLE
// ═══════════════════════════════════════════════════════════════════════════

function printSummary(opts: ProjectOptions): void {
  const h = c.hex.bind(null, PALETTE.muted);
  const p = c.hex.bind(null, PALETTE.primary);
  const s = c.hex.bind(null, PALETTE.secondary);
  const g = c.hex.bind(null, PALETTE.success);

  const rows: Array<[string, string]> = [
    ["Name", c.bold(opts.name)],
    ["Runtime", s(opts.runtime)],
    ["Database", opts.orm === "drizzle" ? s("Drizzle ORM") : h("none")],
    ["Validator", opts.validator ? g("yes") : h("no")],
    ["i18n / RTL", opts.i18n ? g("yes") : h("no")],
    ["Auth", opts.auth ? g("yes") : h("no")],
    ["Logger", opts.logger ? g("yes") : h("no")],
    ["OpenAPI", opts.openapi ? g("yes") : h("no")],
    ["WebSocket", opts.websocket ? g("yes") : h("no")],
    ["Git Init", opts.initGit ? g("yes") : h("no")],
  ];

  const labelWidth = Math.max(...rows.map(([label]) => label.length));
  const lineWidth = 48;

  // Build the box manually
  let summary = `\n  ${p("┌" + "─".repeat(lineWidth) + "┐")}\n`;
  summary += `  ${p("│")}  ${c.bold("Project Summary")}${h(" ─".repeat(Math.max(0, Math.floor((lineWidth - 20) / 2))))}  ${p("│")}\n`;
  summary += `  ${p("├" + "─".repeat(lineWidth) + "┤")}\n`;

  for (const [label, value] of rows) {
    const paddedLabel = label.padEnd(labelWidth);
    summary += `  ${p("│")}  ${h(paddedLabel)}  ${value}${p("│").padStart(lineWidth - labelWidth - paddedLabel.length + 6)}\n`;
  }

  summary += `  ${p("└" + "─".repeat(lineWidth) + "┘")}`;

  console.log(summary);
}

// ═══════════════════════════════════════════════════════════════════════════
//  INTERACTIVE PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Interactive select prompt. Renders a list of choices the user can
 * navigate with arrow keys and select with Enter.
 */
async function select<T extends string>(
  question: string,
  choices: Array<{ value: T; label: string; hint?: string }>,
  defaultVal: T,
): Promise<T> {
  if (!c.isTTY || process.env.CI) {
    // Fallback to simple text prompt in non-TTY / CI
    const hintList = choices.map((ch) => ch.value).join(" / ");
    const answer = await textInput(`${question} (${hintList})`, defaultVal);
    const found = choices.find((ch) => ch.value === answer);
    return (found?.value ?? defaultVal) as T;
  }

  let selectedIndex = choices.findIndex((ch) => ch.value === defaultVal);
  if (selectedIndex < 0) selectedIndex = 0;

  const render = () => {
    let output = `  ${c.hex(PALETTE.secondary, "◆")} ${c.bold(question)}\n`;
    for (let i = 0; i < choices.length; i++) {
      const ch = choices[i]!;
      const cursor = i === selectedIndex ? c.hex(PALETTE.primary, "❯") : " ";
      const label =
        i === selectedIndex ? c.hex(PALETTE.primary, ch.label) : c.dim(ch.label);
      const hint = ch.hint ? c.dim(` ${ch.hint}`) : "";
      const selected = i === selectedIndex ? c.hex(PALETTE.primary, "●") : c.dim("○");
      output += `    ${cursor} ${selected} ${label}${hint}\n`;
    }
    return output;
  };

  return new Promise<T>((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    stdin.setRawMode(true);
    stdin.resume();

    // Render initial view
    process.stdout.write(render());

    const onData = (data: Buffer) => {
      const key = data.toString();

      if (key === "\u001b[A") {
        // Up arrow
        selectedIndex = (selectedIndex - 1 + choices.length) % choices.length;
        moveUp(choices.length + 1);
        process.stdout.write(render());
      } else if (key === "\u001b[B") {
        // Down arrow
        selectedIndex = (selectedIndex + 1) % choices.length;
        moveUp(choices.length + 1);
        process.stdout.write(render());
      } else if (key === "\r" || key === "\n") {
        // Enter
        cleanup();
        resolve(choices[selectedIndex]!.value);
      } else if (key === "\u0003") {
        // Ctrl+C
        cleanup();
        process.stdout.write("\n");
        process.exit(0);
      }
    };

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
    };

    stdin.on("data", onData);
  });
}

/**
 * Confirm prompt (yes / no). Interactive with arrow keys.
 */
async function confirm(question: string, defaultVal: boolean): Promise<boolean> {
  if (!c.isTTY || process.env.CI) {
    const defaultStr = defaultVal ? "yes" : "no";
    const answer = await textInput(`${question} (yes / no)`, defaultStr);
    const lower = answer.toLowerCase();
    if (lower === "yes" || lower === "y") return true;
    if (lower === "no" || lower === "n") return false;
    return defaultVal;
  }

  let selected = defaultVal;

  const render = () => {
    const yes = selected
      ? c.hex(PALETTE.primary, "●") + " " + c.hex(PALETTE.primary, "Yes")
      : c.dim("○ Yes");
    const no = !selected
      ? c.hex(PALETTE.primary, "●") + " " + c.hex(PALETTE.primary, "No")
      : c.dim("○ No");
    return `  ${c.hex(PALETTE.secondary, "◆")} ${c.bold(question)}\n    ${yes}  ${no}\n`;
  };

  return new Promise<boolean>((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    stdin.setRawMode(true);
    stdin.resume();

    process.stdout.write(render());

    const onData = (data: Buffer) => {
      const key = data.toString();

      if (key === "\u001b[D" || key === "\u001b[C" || key === "\t") {
        // Left/Right arrow or Tab to toggle
        selected = !selected;
        moveUp(2);
        process.stdout.write(render());
      } else if (key === "\r" || key === "\n") {
        // Enter
        cleanup();
        resolve(selected);
      } else if (key === "\u0003") {
        cleanup();
        process.stdout.write("\n");
        process.exit(0);
      }
    };

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(wasRaw ?? false);
      stdin.pause();
    };

    stdin.on("data", onData);
  });
}

/**
 * Simple text input prompt.
 */
async function textInput(question: string, defaultVal: string): Promise<string> {
  const prefix = c.hex(PALETTE.secondary, "◇");
  process.stdout.write(`  ${prefix} ${c.bold(question)} ${c.dim(`[${defaultVal}]`)} `);

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
  processingBuffer = false;
}

/**
 * Move cursor up N lines for re-rendering.
 */
function moveUp(lines: number): void {
  process.stdout.write(`\x1b[${lines}A`);
}

function validateChoice<T extends string>(value: string | undefined, valid: T[], fallback: T): T {
  if (value && valid.includes(value as T)) return value as T;
  return fallback;
}
