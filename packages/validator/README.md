# boxfw-validator

[![npm version](https://badge.fury.io/js/boxfw-validator.svg)](https://www.npmjs.com/package/boxfw-validator)

Zod-based request validation for **Box Framework** with full TypeScript type inference.

## Installation

```bash
bun add boxfw-validator
```

> Requires `boxfw-core` and `zod` as peer dependencies.

## Quick Start

```ts
import { Box } from "boxfw-core";
import { v } from "boxfw-validator";
import { z } from "zod";

const app = new Box();

app.get(
  "/user/:id",
  v(
    {
      params: z.object({ id: z.string() }),
      query: z.object({ page: z.coerce.number().optional() }),
    },
    (c) => {
      // c.validated.params.id — fully typed as string
      // c.validated.query.page — typed as number | undefined
      return c.json({ id: c.validated.params.id });
    },
  ),
);
```

## Features

- **Body, params, query, and headers validation** — validate any part of the request
- **Full TypeScript inference** — `c.validated` is fully typed based on your Zod schemas
- **Structured error responses** — returns 400 with detailed `{ error, issues }` on validation failure
- **Zero-cost when unused** — tree-shakeable, no runtime overhead if you don't use it

## API

```ts
v(schemas, handler)
```

| Schema field | Source | Required |
|--------------|--------|----------|
| `params` | `c.params` | No |
| `query` | `c.url.searchParams` | No |
| `headers` | `c.req.headers` | No |
| `body` | `await c.req.json()` | No |

## License

MIT — see the [LICENSE](LICENSE) file for details.
