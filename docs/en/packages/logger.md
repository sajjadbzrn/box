# Logger — Structured Logging

The `boxfw-logger` package provides professional structured logging with pretty console output (development) and JSON output (production), plus automatic request logging middleware.

## Installation

```bash
bun add boxfw-logger
```

## Quick Start

```ts
import { createLogger, requestLogger } from "boxfw-logger";

const log = createLogger({ level: "debug" });
log.info("Server started", { port: 3000 });
```

## Logger API

```ts
const log = createLogger({
  level: "info",      // Minimum level: debug | info | warn | error | fatal
  format: "pretty",    // Output format: pretty | json
  colors: true,        // ANSI colors (pretty mode only)
  name: "my-app",      // Application name
  timestamp: true,     // Include timestamps
});

log.debug("Connecting to database...");  // Only shown when level ≤ debug
log.info("Server started", { port: 3000 });
log.warn("High memory usage", { memoryMB: 512 });
log.error("Database connection failed", { error: err });
log.fatal("Cannot recover, shutting down");

// Explicit level
log.log("info", "custom message");
```

## Log Levels

| Level | Number | Description |
|-------|--------|-------------|
| `debug` | 0 | Detailed debugging information |
| `info` | 1 | General operational messages |
| `warn` | 2 | Warnings, non-critical issues |
| `error` | 3 | Errors, failures |
| `fatal` | 4 | Critical failures requiring shutdown |

Messages below the configured level are filtered out.

## Output Formats

### Pretty (default) — Development

```
12:34:56.789 [INFO] my-app → Server started {"port":3000}
12:34:56.790 [WARN] my-app → High memory usage {"memoryMB":512}
12:34:56.791 [EROR] my-app → Database connection failed
  Error: Connection refused
    at connect (db.ts:42:5)
```

### JSON — Production

```json
{"level":"info","message":"Server started","timestamp":"2026-07-04T12:34:56.789Z","name":"my-app","meta":{"port":3000}}
{"level":"error","message":"Database connection failed","timestamp":"2026-07-04T12:34:56.791Z","name":"my-app","error":{"message":"Connection refused","stack":"Error: Connection refused\n    at connect (db.ts:42:5)"}}
```

## Child Loggers

Create child loggers with bound context that's included in every log call:

```ts
const child = log.child({ requestId: "req-123", userId: "u-42" });
child.info("Fetching user data");
// Output includes requestId and userId in every log line
```

## Request Logging Middleware

Automatically logs every HTTP request:

```ts
app.use(requestLogger()); // Uses default logger

// With custom configuration:
app.use(requestLogger({
  logger: log,
  logQuery: true,
  logHeaders: true,
  excludePaths: [/^\/health/, /^\/metrics/],
}));
```

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logger` | `LoggerInterface` | default logger | Logger instance to use |
| `levelSuccess` | `LogLevel` | `"info"` | Level for 2xx/3xx responses |
| `levelClientError` | `LogLevel` | `"warn"` | Level for 4xx responses |
| `levelServerError` | `LogLevel` | `"error"` | Level for 5xx responses |
| `excludePaths` | `RegExp[]` | `[]` | Paths to skip logging |
| `logHeaders` | `boolean` | `false` | Log request headers |
| `logQuery` | `boolean` | `false` | Log query parameters |
| `requestId` | `function` | auto | Custom request ID function |

### Sample Output

```
12:34:56.789 [DBUG] http → → GET /users {"requestId":"a1b2c3d4"}
12:34:56.790 [INFO] http → ← GET /users 200 42ms
12:34:56.791 [WARN] http → ← GET /not-found 404 5ms
12:34:56.792 [EROR] http → ← GET /error 500 100ms
```

### Sensitive Header Protection

When `logHeaders: true`, sensitive headers are automatically filtered:

- `authorization`
- `cookie`
- `x-api-key`

## API

| Function | Description |
|----------|-------------|
| `createLogger(options)` | Create a new logger instance |
| `requestLogger(options)` | Request logging middleware |

---

> 📚 [Back to Index](../index.md) · [Previous: OpenAPI](openapi.md) · [Next: WebSocket](../guides/websocket.md)
