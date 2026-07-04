# Box Framework Documentation

> **The opinionated, batteries-included backend framework for solo/indie developers**  
> Bun-native, edge-first, with first-class Drizzle, i18n, and dual-runtime support.

## Overview

Box is a TypeScript-first web framework built for **Bun** and **Cloudflare Workers**. It combines a fast radix-tree router, onion-model middleware, and a rich ecosystem of optional packages — so you get everything you need to ship full-stack apps to the edge.

## Table of Contents

### 🚀 Getting Started

| Doc | Description |
|-----|-------------|
| [Getting Started](getting-started.md) | Installation, quick start, and project setup |
| [create-boxfw](getting-started.md#scaffolding) | Scaffold a new project with `bunx create-boxfw` |

### 🧱 Core

| Doc | Description |
|-----|-------------|
| [App](core/app.md) | The main application class — routes, middleware, server |
| [Context](core/context.md) | Request/response context — params, body, headers, responses |
| [Router](core/router.md) | Radix-tree router — static, dynamic, wildcard routes |
| [Middleware](core/middleware.md) | Onion-model middleware pipeline |

### 📦 Packages

| Doc | Description |
|-----|-------------|
| [Validator](packages/validator.md) | Zod-based request validation with full type inference |
| [Adapters](packages/adapters.md) | Dual-runtime (Bun + Cloudflare Workers) |
| [DB](packages/db.md) | Drizzle ORM integration with migration runner |
| [Auth](packages/auth.md) | JWT (HS256) + session authentication |
| [i18n](packages/i18n.md) | Internationalization, RTL, bilingual errors |
| [OpenAPI](packages/openapi.md) | Auto-generate OpenAPI 3.0 specs |
| [Logger](packages/logger.md) | Structured logging with pretty/JSON output |

### 🛠️ Guides

| Doc | Description |
|-----|-------------|
| [WebSocket](guides/websocket.md) | Real-time communication with WebSockets |
| [Error Handling](guides/error-handling.md) | Custom error handlers and validation errors |
| [Testing](guides/testing.md) | Testing Box apps with Bun test |
| [Deployment](guides/deployment.md) | Deploy to Bun or Cloudflare Workers |

### 🔬 Advanced

| Doc | Description |
|-----|-------------|
| [Architecture](advanced/architecture.md) | Framework internals and design decisions |
| [Benchmarking](advanced/benchmarking.md) | Performance comparisons |

---

## Quick Links

| Action | Command |
|--------|---------|
| Scaffold a project | `bunx create-boxfw` |
| Install core | `bun add boxfw-core` |
| Run tests | `bun test` |
| Start dev server | `bun run --watch src/index.ts` |

---

## Packages at a Glance

```text
boxfw-core         → Router, Context, Middleware, App, WebSocket
boxfw-validator    → Zod validation (v()) with type inference
boxfw-adapters     → Bun + Cloudflare Workers runtime wrappers
boxfw-db           → Drizzle ORM (SQLite, D1, PG)
boxfw-auth         → JWT (HS256) + cookie sessions
boxfw-i18n         → Locale detection, RTL, translations
boxfw-openapi      → OpenAPI 3.0 spec generator
boxfw-logger       → Structured logging (pretty + JSON)
create-boxfw       → Project scaffolding CLI
```

---

> 📚 Also available in [Persian (فارسی)](../fa/index.md)
