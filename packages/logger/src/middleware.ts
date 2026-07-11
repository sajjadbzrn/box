import type { Middleware } from "boxfw-core";
import { createLogger } from "./logger";
import type { RequestLoggerOptions } from "./types";

/**
 * Generate a short random request ID (8 hex characters).
 */
function generateRequestId(): string {
  return Math.random().toString(16).slice(2, 10);
}

/**
 * Extract a request ID from headers or generate one.
 */
function extractRequestId(req: Request, customFn?: (req: Request) => string): string {
  if (customFn) return customFn(req);
  const existing = req.headers.get("x-request-id") || req.headers.get("x-trace-id");
  return existing ?? generateRequestId();
}

/**
 * Truncate long paths to avoid log bloat.
 */
function truncatePath(path: string, maxLen = 200): string {
  return path.length > maxLen ? path.slice(0, maxLen) + "..." : path;
}

/**
 * Determine log level based on HTTP status code.
 */
function statusToLevel(status: number, opts: RequestLoggerOptions): "info" | "warn" | "error" {
  if (status >= 500) return (opts.levelServerError ?? "error") as "info" | "warn" | "error";
  if (status >= 400) return (opts.levelClientError ?? "warn") as "info" | "warn" | "error";
  return (opts.levelSuccess ?? "info") as "info" | "warn" | "error";
}

/**
 * Request logging middleware for Box.
 *
 * Automatically logs every HTTP request with:
 * - HTTP method and path
 * - Response status code
 * - Request duration
 * - Request ID (for tracing)
 * - Optional: headers, query params
 *
 * @example
 * ```ts
 * import { requestLogger } from "boxfw-logger";
 *
 * const app = new Box();
 * app.use(requestLogger()); // Uses default logger
 *
 * // Or with a custom logger:
 * const log = createLogger({ level: "debug" });
 * app.use(requestLogger({ logger: log, logQuery: true }));
 * ```
 */
export function requestLogger(options: RequestLoggerOptions = {}): Middleware {
  const log = options.logger ?? createLogger({ name: "http" });
  const excludePatterns = options.excludePaths ?? [];

  return async (c, next) => {
    // Check if path should be excluded
    const path = truncatePath(c.path);
    for (const pattern of excludePatterns) {
      if (pattern.test(path)) {
        return next();
      }
    }

    const start = Date.now();
    const requestId = extractRequestId(c.req, options.requestId);

    // Attach request ID to context store for downstream use
    c.store.set("requestId", requestId);

    // Build extra metadata
    const meta: Record<string, unknown> = {
      requestId,
    };

    if (options.logHeaders) {
      const headers: Record<string, string> = {};
      c.req.headers.forEach((val, key) => {
        // Skip sensitive headers
        if (!["authorization", "cookie", "x-api-key"].includes(key.toLowerCase())) {
          headers[key] = val;
        }
      });
      meta.headers = headers;
    }

    if (options.logQuery) {
      const query: Record<string, string> = {};
      c.url.searchParams.forEach((val, key) => {
        query[key] = val;
      });
      meta.query = query;
    }

    // Log the incoming request at debug level
    const childLog = log.child({ requestId });
    childLog.debug(`→ ${c.method} ${path}`, meta);

    try {
      const res = await next();

      const duration = Date.now() - start;
      const level = statusToLevel(res.status, options);

      childLog.log(level, `← ${c.method} ${path}`, {
        status: res.status,
        duration,
      });

      return res;
    } catch (err) {
      const duration = Date.now() - start;

      childLog.error(`✗ ${c.method} ${path}`, {
        status: 500,
        duration,
        error: err instanceof Error ? err : new Error(String(err)),
      });

      throw err;
    }
  };
}
