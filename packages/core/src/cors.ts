import type { Middleware } from "./types";

/**
 * Configuration options for the `cors()` middleware.
 */
export interface CorsOptions {
  /**
   * Allowed origins. Default: `"*"`.
   * Use a string for a single origin, or an array for multiple.
   */
  origin?: string | string[];
  /**
   * Allowed HTTP methods. Default: `"GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS"`.
   */
  methods?: string;
  /**
   * Allowed request headers. Default: matches the request's `Access-Control-Request-Headers`.
   */
  allowedHeaders?: string;
  /**
   * Exposed response headers.
   */
  exposedHeaders?: string;
  /**
   * Whether to include credentials (cookies, auth). Default: `false`.
   */
  credentials?: boolean;
  /**
   * Max age for preflight cache (seconds). Default: `86400` (24 hours).
   */
  maxAge?: number;
}

/**
 * CORS middleware for Box.
 *
 * Handles both simple requests (adding `Access-Control-Allow-Origin` headers)
 * and preflight `OPTIONS` requests (returning 204 immediately).
 *
 * @example
 * ```ts
 * import { cors } from "boxfw-core";
 *
 * // Allow all origins (default)
 * app.use(cors());
 *
 * // Tight configuration
 * app.use(cors({
 *   origin: "https://myapp.com",
 *   credentials: true,
 *   methods: "GET, POST, PUT, DELETE",
 *   allowedHeaders: "Content-Type, Authorization",
 * }));
 *
 * // Multiple origins
 * app.use(cors({
 *   origin: ["https://app1.com", "https://app2.com"],
 * }));
 * ```
 */
export function cors(options: CorsOptions = {}): Middleware {
  const origin = options.origin ?? "*";
  const methods = options.methods ?? "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS";
  const credentials = options.credentials ?? false;
  const maxAge = options.maxAge ?? 86400;    return async (c, next) => {
    const requestOrigin = c.req.headers.get("origin") ?? "";

    // Determine the response origin header
    let allowOrigin: string;
    if (typeof origin === "string") {
      allowOrigin = origin === "*" && credentials ? requestOrigin : origin;
    } else {
      allowOrigin = origin.includes(requestOrigin) ? requestOrigin : (origin[0] ?? "*");
    }

    // Handle preflight requests
    if (c.method === "OPTIONS") {
      const headers = new Headers();
      headers.set("Access-Control-Allow-Origin", allowOrigin);
      headers.set("Access-Control-Allow-Methods", methods);

      if (options.allowedHeaders) {
        headers.set("Access-Control-Allow-Headers", options.allowedHeaders);
      } else {
        const requestHeaders = c.req.headers.get("access-control-request-headers");
        if (requestHeaders) {
          headers.set("Access-Control-Allow-Headers", requestHeaders);
        }
      }

      if (credentials) {
        headers.set("Access-Control-Allow-Credentials", "true");
      }

      headers.set("Access-Control-Max-Age", String(maxAge));

      return new Response(null, { status: 204, headers });
    }

    // Simple / actual request
    const res = await next();

    res.headers.set("Access-Control-Allow-Origin", allowOrigin);

    if (options.exposedHeaders) {
      res.headers.set("Access-Control-Expose-Headers", options.exposedHeaders);
    }

    if (credentials) {
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }

    return res;
  };
}
