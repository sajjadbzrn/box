# Architecture — Framework Internals

## High-Level Design

```text
┌─────────────────────────────────────────────┐
│                  App (Box)                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │  Router   │  │Middleware│  │  WebSocket  │ │
│  │ (Radix    │  │ (Onion   │  │  (Bun       │ │
│  │  Tree)    │  │  Model)  │  │   Native)   │ │
│  └──────────┘  └──────────┘  └────────────┘ │
│  ┌──────────────────────────────────────────┐│
│  │           Context (Req/Res)              ││
│  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
         │                            │
    Bun.serve()              Cloudflare Worker
         │                            │
    Bun runtime              fetch(req, env)
```

## Package Dependency Graph

```text
boxfw-core ─────────────────────────────────────┐
    │                                           │
    ├── boxfw-validator (depends on core)        │
    ├── boxfw-adapters (depends on core)         │
    ├── boxfw-db (depends on core)               │
    ├── boxfw-auth (depends on core)             │
    ├── boxfw-i18n (depends on core)             │
    ├── boxfw-openapi (depends on core)          │
    ├── boxfw-logger (depends on core)           │
    │                                           │
    └── create-boxfw (depends on core)          │
                                                │
All packages depend on boxfw-core.              │
No circular dependencies.                       │
```

## Request Lifecycle

```text
1. Request arrives
         │
2. App.fetch(request)
         │
3. Parse URL, extract method and path
         │
4. Router.lookup(method, path)
   ├── Walk radix tree
   ├── Match static > dynamic > wildcard
   └── Return { handler, params } or null
         │
5. Create Context(request, params)
         │
6. Compose middleware pipeline
   ├── compose([mw1, mw2, ...])
   └── dispatch(0) → mw1(mw2(...handler))
         │
7. Execute middleware chain (onion)
   ├── mw1-before → mw2-before → handler
   └── mw2-after → mw1-after
         │
8. Return Response
```

## Router Architecture

The radix tree is a compressed trie where common URL prefixes are merged into single nodes:

```text
/users
/users/:id
/users/:id/posts
/static/*
/health

Compressed tree:
         /users/
           ├── (handler for /users)
           ├── :id/
           │    ├── (handler for /users/:id)
           │    └── posts (handler for /users/:id/posts)
         /static/*
         /health
```

## Onion Middleware

Each middleware is a function `(ctx, next) => Promise<Response>`:

```text
Request → ┌─────────────────────────────────┐
          │ Middleware 1 (outer layer)       │
          │  ├─ Before next()               │
          │  │  ┌─────────────────────────┐ │
          │  │  │ Middleware 2             │ │
          │  │  │  ├─ Before next()       │ │
          │  │  │  │  ┌───────────────┐   │ │
          │  │  │  │  │ Route Handler │   │ │
          │  │  │  │  └───────────────┘   │ │
          │  │  │  └─ After next()        │ │
          │  │  └─────────────────────────┘ │
          │  └─ After next()                │
          └─────────────────────────────────┘
Response ←
```

## Dual Runtime

The `EnvStore` interface abstracts away runtime differences:

```ts
interface EnvStore {
  get(key: string): unknown;
}

// Bun
bunEnv(): EnvStore → reads from process.env

// Cloudflare Workers
workerEnv(bindings): EnvStore → reads from env argument
```

## Zero-Cost Abstraction

Packages are tree-shakeable — importing `boxfw-logger` doesn't bundle `boxfw-db`. Each package only depends on `boxfw-core`, keeping bundles minimal.

---

> 📚 [Back to Index](../index.md) · [Previous: Deployment](../guides/deployment.md) · [Next: Benchmarking](benchmarking.md)
