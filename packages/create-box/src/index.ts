#!/usr/bin/env bun
import { main, parseCliArgs } from "./prompts";

const cliArgs = parseCliArgs(process.argv.slice(2));

main(cliArgs).catch((err) => {
  process.stderr.write(`\nError: ${err.message}\n`);
  if (process.env.DEBUG) {
    process.stderr.write(err.stack + "\n");
  }
  process.exit(1);
});

// Graceful exit on Ctrl+C
process.on("SIGINT", () => {
  process.stdout.write("\n");
  process.exit(0);
});
