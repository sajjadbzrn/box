# boxfw-logger

[![npm version](https://badge.fury.io/js/boxfw-logger.svg)](https://www.npmjs.com/package/boxfw-logger)

Professional **structured logger** for **Box Framework** — pretty console output, JSON mode, log levels, and request logging middleware.

## Installation

```bash
bun add boxfw-logger
```

> Requires `boxfw-core` as a peer dependency.

## Quick Start

```ts
import { createLogger, requestLogger } from "boxfw-logger";
import { Box } from "boxfw-core";

// Standalone logging
const log = createLogger({ level: "debug" });
log.info("Server started", { port: 3000 });

// Request logging middleware
const app = new Box();
app.use(requestLogger());
```

## Features

- **Log levels** — `debug`, `info`, `warn`, `error`, `fatal` with level-based filtering
- **Pretty output** — ANSI-colored console output for development
- **JSON output** — structured JSON for production / log aggregation
- **Request logging** — middleware that logs method, path, status, and duration
- **Child loggers** — create child loggers with bound context metadata
- **Custom streams** — write to any stream (file, socket, etc.)

## API

```ts
// Create a logger
const log = createLogger({ level: "info", format: "pretty" });

// Log methods
log.debug("message", { meta });
log.info("message", { meta });
log.warn("message", { meta });
log.error("message", { meta });
log.fatal("message", { meta });
log.log("level", "message", { meta });

// Child logger with bound context
const child = log.child({ requestId: "abc-123" });

// Request logging middleware
app.use(requestLogger({ log, excludePaths: ["/health"] }));
```

## License

MIT — see the [LICENSE](LICENSE) file for details.
