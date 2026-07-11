#!/usr/bin/env bun
import { main, parseCliArgs } from "./prompts";
import { c } from "./utils/colors";

const cliArgs = parseCliArgs(process.argv.slice(2));

main(cliArgs).catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`\n  ${c.bold(c.hex("#ef4444", "✗"))} ${c.brightRed(message)}\n`);
  if (process.env.DEBUG && err instanceof Error && err.stack) {
    process.stderr.write(`  ${c.dim(err.stack)}\n`);
  }
  process.exit(1);
});

// Graceful exit on Ctrl+C
process.on("SIGINT", () => {
  process.stdout.write("\n");
  process.exit(0);
});
