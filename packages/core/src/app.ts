import type { ServerWebSocket } from "bun";
import type { Context } from "./context";
import { Context as Ctx } from "./context";
import { compose } from "./middleware";
import { Router } from "./router";
import type { EnvStore, Handler, HttpMethod, MatchResult, Middleware, WebSocketHandler } from "./types";

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

  get(path: string, handler: Handler): this {
    this.router.add("GET", path, handler);
    return this;
  }

  post(path: string, handler: Handler): this {
    this.router.add("POST", path, handler);
    return this;
  }

  put(path: string, handler: Handler): this {
    this.router.add("PUT", path, handler);
    return this;
  }

  delete(path: string, handler: Handler): this {
    this.router.add("DELETE", path, handler);
    return this;
  }

  patch(path: string, handler: Handler): this {
    this.router.add("PATCH", path, handler);
    return this;
  }

  head(path: string, handler: Handler): this {
    this.router.add("HEAD", path, handler);
    return this;
  }

  options(path: string, handler: Handler): this {
    this.router.add("OPTIONS", path, handler);
    return this;
  }

  route(method: HttpMethod, path: string, handler: Handler): this {
    this.router.add(method, path, handler);
    return this;
  }

  // ---- WebSockets (Bun-native) ----

  private _wsRoutes: Map<string, WebSocketHandler> = new Map();

  ws(path: string, handlers: WebSocketHandler): this {
    this._wsRoutes.set(path, handlers);
    return this;
  }

  // ---- Middleware ----

  use(middleware: Middleware): this {
    this._middlewares.push(middleware);
    return this;
  }

  notFound(handler: Handler): this {
    this._notFoundHandler = handler;
    return this;
  }

  onError(handler: (error: Error, c: Context) => Response): this {
    this._errorHandler = handler;
    return this;
  }

  // ---- Environment ----

  setEnv(store: EnvStore): this {
    this._envStore = store;
    return this;
  }

  // ---- Request processing ----

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
      return this._errorHandler(error instanceof Error ? error : new Error(String(error)), ctx);
    }
  };

  // ---- Server start ----

  listen(
    options: {
      port?: number;
      hostname?: string;
      development?: boolean;
      tls?: Parameters<typeof Bun.serve>[0]["tls"];
      maxRequestBodySize?: number;
      [key: string]: unknown;
    } = {},
  ): ReturnType<typeof Bun.serve> {
    const wsRoutes = this._wsRoutes;
    const hasWs = wsRoutes.size > 0;

    const app = this;

    // Build websocket config for Bun.serve
    const wsConfig = hasWs
      ? {
          open(ws: ServerWebSocket<unknown>) {
            const path = (ws.data as string | undefined) ?? "";
            const handler = wsRoutes.get(path);
            handler?.open?.(ws as unknown as WebSocket);
          },
          message(ws: ServerWebSocket<unknown>, data: string | BufferSource) {
            const path = (ws.data as string | undefined) ?? "";
            const handler = wsRoutes.get(path);
            handler?.message?.(ws as unknown as WebSocket, data as string | ArrayBuffer);
          },
          close(ws: ServerWebSocket<unknown>, code: number, reason: string) {
            const path = (ws.data as string | undefined) ?? "";
            const handler = wsRoutes.get(path);
            handler?.close?.(ws as unknown as WebSocket, code, reason);
          },
          drain(ws: ServerWebSocket<unknown>) {
            const path = (ws.data as string | undefined) ?? "";
            const handler = wsRoutes.get(path);
            handler?.drain?.(ws as unknown as WebSocket);
          },
        }
      : undefined;

    const server = hasWs
      ? Bun.serve({
          port: options.port ?? 3000,
          hostname: options.hostname,
          development: options.development,
          tls: options.tls,
          maxRequestBodySize: options.maxRequestBodySize,
          fetch(req, server) {
            const url = new URL(req.url);
            if (wsRoutes.has(url.pathname)) {
              const upgraded = server.upgrade(req, { data: url.pathname });
              if (upgraded) return;
            }
            return app.fetch(req);
          },
          websocket: wsConfig!,
        })
      : Bun.serve({
          port: options.port ?? 3000,
          hostname: options.hostname,
          development: options.development,
          tls: options.tls,
          maxRequestBodySize: options.maxRequestBodySize,
          fetch(req) {
            return app.fetch(req);
          },
        });

    // Graceful shutdown on SIGTERM/SIGINT (Ctrl+C)
    const shutdown = () => {
      server.stop();
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    return server;
  }
}
