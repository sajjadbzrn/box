import type { Context } from "./context";

/**
 * A route handler receives a `Context` and returns a `Response`.
 * Can be async or sync.
 */
export type Handler = (c: Context) => Response | Promise<Response>;

/**
 * Middleware function signature.
 *
 * Receives `(ctx, next)` where `next()` yields the downstream `Response`.
 * A middleware **must** return a `Response`:
 * - Return `await next()` to pass through after decoration,
 * - Or return your own `Response` to short-circuit (e.g., auth rejection).
 */
export type Middleware = (c: Context, next: () => Promise<Response>) => Promise<Response>;

/**
 * HTTP methods supported by the router.
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

/**
 * Internal route entry stored in the radix tree.
 */
export interface RouteEntry {
  handler: Handler;
  method: HttpMethod;
}

/**
 * The result of a successful route lookup.
 */
export interface MatchResult {
  handler: Handler;
  params: Record<string, string>;
}

/**
 * A runtime-neutral environment store.
 *
 * Implementations are provided by `box-adapters` for Bun
 * (`bunEnv()`) and Cloudflare Workers (`workerEnv()`).
 */
export interface EnvStore {
  get(key: string): unknown;
}

/**
 * WebSocket event handlers for `app.ws()`.
 */
export interface WebSocketHandler {
  open?(ws: WebSocket): void;
  message?(ws: WebSocket, data: string | ArrayBuffer): void;
  close?(ws: WebSocket, code: number, reason: string): void;
  drain?(ws: WebSocket): void;
}
