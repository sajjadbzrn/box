#!/usr/bin/env bun
/**
 * `create-box` — scaffolding CLI for Box projects.
 *
 * Usage:
 *   bunx create-box
 *
 * Interactive prompts collect project preferences, then
 * scaffold a fully working project in one command.
 */

import { main } from "./prompts";

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
