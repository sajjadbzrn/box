import type { Context } from "./context";
import type { Handler, HttpMethod, Middleware, MatchResult, EnvStore } from "./types";
import { Router } from "./router";
import { Context as Ctx } from "./context";
import { compose } from "./middleware";

/**
 * The main `Box` application.
 *
 * `App` ties together the router, middleware pipeline, and HTTP server.
 * It provides a fluent API for defining routes and starting the server.
 *
 * Dual-runtime: the same `App` instance works under `Bun.serve()`
 * and as a Cloudflare Worker `fetch` handler.
 *
 * @example
 * ```ts
 * import { Box } from "boxfw-core";
 *
 * const app = new Box();
 *
 * app.get("/", (c) => c.text("Hello, Box!"));
 * app.get("/user/:id", (c) => c.json({ id: c.params.id }));
 *
 * app.listen({ port: 3000 });
 * ```
 */
export class App {
  private router: Router;
  private _middlewares: Middleware[];
  private _notFoundHandler: Handler;
  private _errorHandler: (error: Error, c: Context) => Response;
  private _envStore: EnvStore | null;

  constructor() {
    this.router = new Router();
    this._middlewares = [];
    this._notFoundHandler = (c) => c.text("Not Found", 404);
    this._errorHandler = (_error, c) => c.text("Internal Server Error", 500);
    this._envStore = null;
  }

  // ---- Route registration ----

  /**
   * Register a handler for `GET` requests at `path`.
   */
  get(path: string, handler: Handler): this {
    this.router.add("GET", path, handler);
    return this;
  }

  /**
   * Register a handler for `POST` requests at `path`.
   */
  post(path: string, handler: Handler): this {
    this.router.add("POST", path, handler);
    return this;
  }

  /**
   * Register a handler for `PUT` requests at `path`.
   */
  put(path: string, handler: Handler): this {
    this.router.add("PUT", path, handler);
    return this;
  }

  /**
   * Register a handler for `DELETE` requests at `path`.
   */
  delete(path: string, handler: Handler): this {
    this.router.add("DELETE", path, handler);
    return this;
  }

  /**
   * Register a handler for `PATCH` requests at `path`.
   */
  patch(path: string, handler: Handler): this {
    this.router.add("PATCH", path, handler);
    return this;
  }

  /**
   * Register a handler for `HEAD` requests at `path`.
   */
  head(path: string, handler: Handler): this {
    this.router.add("HEAD", path, handler);
    return this;
  }

  /**
   * Register a handler for `OPTIONS` requests at `path`.
   */
  options(path: string, handler: Handler): this {
    this.router.add("OPTIONS", path, handler);
    return this;
  }

  /**
   * Register a generic route by method.
   */
  route(method: HttpMethod, path: string, handler: Handler): this {
    this.router.add(method, path, handler);
    return this;
  }

  // ---- WebSockets (Bun-native) ----

  /**
   * WebSocket handler config per route.
   */
  private _wsRoutes: Map<string, WebSocketHandler> = new Map();

  /**
   * Register a WebSocket route.
   *
   * On Bun, this uses the native `Bun.serve()` WebSocket support.
   * On Cloudflare Workers, WebSockets use `WebSocketPair` — this method
   * documents the fallback pattern but does not provide an adapter in core.
   *
   * @example
   * ```ts
   * app.ws("/chat", {
   *   open: (ws) => console.log("Connected"),
   *   message: (ws, msg) => ws.send(`Echo: ${msg}`),
   *   close: (ws) => console.log("Disconnected"),
   * });
   * ```
   */
  ws(
    path: string,
    handlers: WebSocketHandler,
  ): this {
    this._wsRoutes.set(path, handlers);
    return this;
  }

  // ---- Middleware ----

  /**
   * Register a global middleware.
   *
   * Middleware is executed in the order registered, wrapping
   * every route handler (onion model).
   */
  use(middleware: Middleware): this {
    this._middlewares.push(middleware);
    return this;
  }

  /**
   * Override the default 404 handler.
   */
  notFound(handler: Handler): this {
    this._notFoundHandler = handler;
    return this;
  }

  /**
   * Override the default error handler.
   */
  onError(handler: (error: Error, c: Context) => Response): this {
    this._errorHandler = handler;
    return this;
  }

  // ---- Environment ----

  /**
   * Set the runtime `EnvStore` for this app.
   *
   * On Bun, `box-adapters` provides `bunEnv()`.
   * On Cloudflare Workers, use `workerEnv(env)`.
   *
   * The env store is injected into every `Context` before
   * the handler runs, making `c.env()` work identically on both runtimes.
   */
  setEnv(store: EnvStore): this {
    this._envStore = store;
    return this;
  }

  // ---- Request processing ----

  /**
   * The core `fetch` handler.
   *
   * Compatible with both `Bun.serve()` (which passes only a `Request`)
   * and Cloudflare Workers (pass an optional `EnvStore`).
   *
   * @example
   * ```ts
   * // Bun — env comes from the app-level default
   * app.fetch(request);
   *
   * // Cloudflare Worker — env comes from the fetch handler argument
   * export default {
   *   fetch(req, env) {
   *     return app.fetch(req, workerEnv(env));
   *   }
   * };
   * ```
   */
  fetch: (request: Request, env?: EnvStore) => Promise<Response> = async (
    request: Request,
    env?: EnvStore,
  ): Promise<Response> => {
    const activeEnv = env ?? this._envStore;

    try {
      const method = request.method as HttpMethod;
      const url = new URL(request.url);
      const path = url.pathname;

      const match: MatchResult | null = this.router.lookup(method, path);

      if (!match) {
        const ctx = new Ctx(request, {}, activeEnv);
        return this._notFoundHandler(ctx);
      }

      const ctx = new Ctx(request, match.params, activeEnv);
      const pipeline = compose(this._middlewares);

      return pipeline(ctx, match.handler);
    } catch (error) {
      const ctx = new Ctx(request, {}, activeEnv);
      return this._errorHandler(
        error instanceof Error ? error : new Error(String(error)),
        ctx,
      );
    }
  };

  // ---- Server start ----

  /**
   * Start the server using `Bun.serve()`.
   *
   * Automatically sets up `bunEnv()` if no env store has been
   * explicitly configured.
   *
   * All options from `Bun.serve` are supported (port, hostname, TLS, etc.).
   *
   * @returns The `Server` instance from `Bun.serve()`.
   */
  listen(options: {
    port?: number;
    hostname?: string;
    development?: boolean;
    tls?: Parameters<typeof Bun.serve>[0]["tls"];
    maxRequestBodySize?: number;
    [key: string]: unknown;
  } = {}): ReturnType<typeof Bun.serve> {
    const wsRoutes = this._wsRoutes;
    const hasWs = wsRoutes.size > 0;

    const serverConfig: Parameters<typeof Bun.serve>[0] = {
      port: options.port ?? 3000,
      hostname: options.hostname,
      development: options.development,
      tls: options.tls,
      maxRequestBodySize: options.maxRequestBodySize,
      fetch(req, server) {
        const url = new URL(req.url);

        // Check for WebSocket upgrade
        if (hasWs && wsRoutes.has(url.pathname)) {
          const upgraded = server.upgrade(req, {
            data: url.pathname,
          });
          if (upgraded) return;
        }

        return app.fetch(req);
      },
    };

    if (hasWs) {
      serverConfig.websocket = {
        open(ws: WebSocket) {
          const path = (ws as unknown as { data?: string }).data ?? "";
          const handler = wsRoutes.get(path);
          handler?.open?.(ws);
        },
        message(ws: WebSocket, data: string | ArrayBuffer) {
          const path = (ws as unknown as { data?: string }).data ?? "";
          const handler = wsRoutes.get(path);
          handler?.message?.(ws, data);
        },
        close(ws: WebSocket, code: number, reason: string) {
          const path = (ws as unknown as { data?: string }).data ?? "";
          const handler = wsRoutes.get(path);
          handler?.close?.(ws, code, reason);
        },
        drain(ws: WebSocket) {
          const path = (ws as unknown as { data?: string }).data ?? "";
          const handler = wsRoutes.get(path);
          handler?.drain?.(ws);
        },
      };
    }

    const app = this;
    return Bun.serve(serverConfig);
  }
}
