import { scaffold } from "./scaffold";

export interface ProjectOptions {
  name: string;
  runtime: "bun" | "workers" | "both";
  orm?: "drizzle" | "none";
  i18n: boolean;
  auth: boolean;
}

export async function main(): Promise<void> {
  console.log("\nBoxFW — scaffold a new Box project\n");

  const options = await promptUser();
  await scaffold(options);

  console.log(`\nDone! Created ${options.name}/`);
  console.log(`\n  cd ${options.name}`);
  console.log("  bun install");
  console.log("  bun dev\n");
}

async function promptUser(): Promise<ProjectOptions> {
  const answers: Partial<ProjectOptions> = {};

  answers.name = await ask("Project name:", "my-box-app");
  if (!answers.name) answers.name = "my-box-app";

  const runtimeChoice = await ask(
    "Runtime target (bun / workers / both):",
    "bun",
  );
  answers.runtime = validateChoice(runtimeChoice, ["bun", "workers", "both"], "bun");

  const ormChoice = await ask(
    "Include ORM (drizzle / none):",
    "drizzle",
  );
  answers.orm = validateChoice(ormChoice, ["drizzle", "none"], "drizzle");

  const i18nChoice = await ask("Include i18n/RTL support? (yes / no):", "yes");
  answers.i18n = i18nChoice.toLowerCase() === "yes";

  const authChoice = await ask("Include auth module? (yes / no):", "no");
  answers.auth = authChoice.toLowerCase() === "yes";

  return answers as ProjectOptions;
}

async function ask(question: string, defaultVal: string): Promise<string> {
  process.stdout.write(`? ${question} [${defaultVal}]: `);

  // Collect remaining buffered chunks
  let remaining = "";
  for (const chunk of askBuffer) {
    remaining += chunk;
    const idx = remaining.indexOf("\n");
    if (idx >= 0) {
      // Push back leftover after the newline
      const spare = remaining.slice(idx + 1);
      if (spare.length > 0) askBuffer.unshift(spare);
      return remaining.slice(0, idx).trim() || defaultVal;
    }
  }

  // Buffer is empty — read new line from stdin
  return readOneLine().then((line) => line.trim() || defaultVal);
}

function readOneLine(): Promise<string> {
  return new Promise<string>((resolve) => {
    let buf = "";
    const onData = (chunk: Buffer | string) => {
      buf += typeof chunk === "string" ? chunk : chunk.toString();
      const idx = buf.indexOf("\n");
      if (idx >= 0) {
        process.stdin.off("data", onData);
        // Store leftover for next ask() call
        const spare = buf.slice(idx + 1);
        if (spare.length > 0) {
          addToBuffer(spare);
        }
        resolve(buf.slice(0, idx));
      }
    };
    process.stdin.on("data", onData);
    process.stdin.resume();
  });
}

// Shared buffer for leftover piped input
const askBuffer: string[] = [];

function addToBuffer(text: string) {
  askBuffer.push(text);
}

function validateChoice<T extends string>(
  value: string,
  valid: T[],
  fallback: T,
): T {
  return valid.includes(value as T) ? (value as T) : fallback;
}
