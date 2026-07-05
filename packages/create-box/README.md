# create-boxfw

[![npm version](https://badge.fury.io/js/create-boxfw.svg)](https://www.npmjs.com/package/create-boxfw)

Scaffold a new **Box Framework** project with interactive prompts — the fastest way to start building.

## Usage

```bash
# Using bunx (recommended)
bunx create-boxfw

# Or with npm / yarn / pnpm
npm create boxfw
yarn create boxfw
pnpm create boxfw
```

## What You Get

The scaffolding tool creates a complete project structure:

```
my-project/
├── src/
│   ├── index.ts        # App entry point
│   ├── routes/         # Route handlers
│   └── db/             # Database schema & migrations
├── package.json
├── tsconfig.json
└── .env
```

## Features

- **Interactive prompts** — choose your router type, database, auth, i18n, and more
- **Zero-config setup** — everything works out of the box
- **TypeScript-first** — strict typing from the start
- **Dual runtime** — scaffold for Bun or Cloudflare Workers

## License

MIT — see the [LICENSE](LICENSE) file for details.
