# boxfw-openapi

[![npm version](https://badge.fury.io/js/boxfw-openapi.svg)](https://www.npmjs.com/package/boxfw-openapi)

**OpenAPI 3.0 spec generator** for **Box Framework** — auto-generate API documentation from route definitions.

## Installation

```bash
bun add boxfw-openapi
```

> Requires `boxfw-core` as a peer dependency.

## Quick Start

```ts
import { Box } from "boxfw-core";
import { openapi } from "boxfw-openapi";

const app = new Box();

app.get(
  "/openapi.json",
  openapi(
    { title: "My API", version: "1.0.0" },
    [
      {
        method: "GET",
        path: "/users",
        summary: "List all users",
        tags: ["Users"],
      },
      {
        method: "POST",
        path: "/users",
        summary: "Create a user",
        tags: ["Users"],
        body: { name: "User name", email: "User email" },
      },
    ],
  ),
);
```

## Features

- **Generate OpenAPI 3.0.3 specs** from simple route definitions
- **Path params** — automatic `:param` to `{param}` conversion
- **Query parameters, request body, and tags** support
- **`zodToOpenApi()`** — extract OpenAPI-compatible schema from Zod objects
- **Zero-config** — works out of the box with any Box Framework app

## API

```ts
// Generate OpenAPI handler
openapi(info: OpenApiInfo, routes: RouteSpec[])

// Convert Zod schemas to OpenAPI properties
zodToOpenApi(zodObject)
```

## License

MIT — see the [LICENSE](LICENSE) file for details.
