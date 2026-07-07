# Upgrade Guide

> **Keep your Box Framework apps up to date.** This guide documents breaking
> changes, new features, and migration steps between versions. Before upgrading,
> always check the [Changelog](/CHANGELOG.md) for a full list of changes.

## Using the Update Script

If you scaffolded your project with `create-boxfw` (≥ v0.2.0), run:

```bash
bun run boxfw:update
```

This updates all `boxfw-*` packages to the **absolute latest** version
regardless of semver range, then runs `bun install`.

---

## 0.1.0 → 0.2.0

### Overview

v0.2.0 adds the **structured logger** package (`boxfw-logger`), includes
various core fixes, and bumps all packages to a consistent `0.2.0` version.

### What's New

#### Logger Package (`boxfw-logger`)

A new optional package for structured logging:

```bash
bun add boxfw-logger
```

```ts
import { createLogger, requestLogger } from "boxfw-logger";

const log = createLogger({ level: "debug" });

// Bare logging
log.info("Server started", { port: 3000 });

// Middleware — logs every HTTP request automatically
app.use(requestLogger({ logger: log }));
```

See the [Logger docs](../packages/logger.md) for full usage.

#### `boxfw:update` Script (scaffolded projects only)

New projects scaffolded with `create-boxfw` now include a script to keep
all boxfw packages up to date:

```bash
bun run boxfw:update
```

If you have an existing project scaffolded with v0.1.0, add this script
manually to your `package.json`:

```json
{
  "scripts": {
    "boxfw:update": "bunx npm-check-updates --target latest --filter /^boxfw-/ -u && bun install"
  }
}
```

### Migration Steps

1. **Update package versions** — bump all `boxfw-*` dependencies in your
   `package.json` from `^0.1.0` to `^0.2.0`:

   ```bash
   # Update each boxfw package you use:
   bun add boxfw-core@^0.2.0
   bun add boxfw-validator@^0.2.0
   bun add boxfw-db@^0.2.0
   bun add boxfw-auth@^0.2.0
   bun add boxfw-i18n@^0.2.0
   bun add boxfw-adapters@^0.2.0
   bun add boxfw-openapi@^0.2.0
   ```

   Or use the `boxfw:update` script described above.

2. **No breaking API changes.** All public APIs from v0.1.0 remain unchanged:
   - `Box` (App), `Context`, `Router`, `compose`, `cors` — same signatures
   - `v()` validator — same API
   - `jwt()`, `signJwt()`, `session()` — same API
   - `D()`, `createDbCtx()`, `migrate()` — same API
   - `localeDetect()`, `t()`, `bilingualError()`, `rtlMeta()` — same API
   - `openapi()`, `zodToOpenApi()` — same API
   - `bunEnv()`, `workerEnv()` — same API

3. **Run your tests** to verify everything still works:

   ```bash
   bun test
   ```

### Breaking Changes

**None.** v0.2.0 is fully backward-compatible with v0.1.0. All existing
code, routes, middleware, and configuration files continue to work without
modification.

---

## Still on 0.1.0?

Run the following to check your current versions:

```bash
bun pm ls | grep boxfw
```

Then follow the [0.1.0 → 0.2.0](#️-010--020) migration steps above.

---

> 📚 [Back to Index](../index.md) · [Previous: Error Handling](error-handling.md) · [Next: Testing](testing.md)
