import type { EnvStore } from "./types";

/**
 * `Context` is the unified request/response object passed through
 * the middleware chain and into route handlers.
 *
 * It provides typed access to the incoming request, extracted route params,
 * parsed query string, and convenience response builders.
 */
export class Context {
  /** The raw incoming `Request` object (Web Standard, works in Bun + Workers). */
  readonly req: Request;

  /** Extracted route parameters (e.g. `/:id` → `{ id: "42" }`). */
  params: Record<string, string>;

  /** Lazy-parsed query parameters from the URL. */
  readonly url: URL;

  /** A generic store for middleware to attach data to the request lifecycle. */
  readonly store: Map<string | symbol, unknown>;

  /** Internal holder for the Drizzle ORM client (set by `box-db`). */
  __db: unknown;

  /** Current locale detected by i18n middleware (set by `box-i18n`). */
  locale: string;

  private _status: number;
  private _headers: Headers;
  private _env: EnvStore | null;

  constructor(req: Request, params: Record<string, string> = {}, env: EnvStore | null = null) {
    this.req = req;
    this.params = params;
    this.__db = null;
    this.locale = "en";
    this.url = new URL(req.url);
    this.store = new Map();
    this._status = 200;
    this._headers = new Headers();
    this._env = env;
  }

  /**
   * Inject the runtime `EnvStore` into this context.
   * Called internally by `App` before dispatching to handlers.
   */
  _setEnv(env: EnvStore | null): void {
    this._env = env;
  }

  /**
   * Read an environment variable or binding, typed as `T`.
   *
   * Returns `undefined` if the key is not set.
   * This works identically on Bun (`process.env`) and Cloudflare Workers
   * (bindings passed to the `fetch` handler).
   *
   * @example
   * ```ts
   * const db = c.env<D1Database>("DB");  // Workers D1 binding
   * const nodeEnv = c.env("NODE_ENV");    // string env var
   * ```
   */
  env<T = string>(key: string): T | undefined {
    return this._env?.get(key) as T | undefined;
  }

  /**
   * Access the Drizzle ORM client injected by the `D()` middleware from `box-db`.
   *
   * For full type safety, use `createDbCtx<T>()` from `box-db` instead.
   */
  get db(): unknown {
    return this.__db;
  }

  /** The HTTP method of the request. */
  get method(): string {
    return this.req.method;
  }

  /** Parsed query parameters. */
  get query(): URLSearchParams {
    return this.url.searchParams;
  }

  /** The path portion of the URL (without query string). */
  get path(): string {
    return this.url.pathname;
  }

  /** Raw headers from the request. */
  get headers(): Headers {
    return this.req.headers;
  }

  /**
   * Set the HTTP status code for the response.
   * Returns `this` for chaining.
   */
  status(code: number): this {
    this._status = code;
    return this;
  }

  /**
   * Set a response header.
   * Returns `this` for chaining.
   */
  header(name: string, value: string): this {
    this._headers.set(name, value);
    return this;
  }

  /**
   * Build and return a JSON `Response`.
   */
  json(data: unknown, status?: number): Response {
    const finalStatus = status ?? this._status;
    this._headers.set("content-type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(data), {
      status: finalStatus,
      headers: this._headers,
    });
  }

  /**
   * Build and return a plain-text `Response`.
   */
  text(data: string, status?: number): Response {
    const finalStatus = status ?? this._status;
    this._headers.set("content-type", "text/plain; charset=utf-8");
    return new Response(data, {
      status: finalStatus,
      headers: this._headers,
    });
  }

  /**
   * Build and return an HTML `Response`.
   */
  html(data: string, status?: number): Response {
    const finalStatus = status ?? this._status;
    this._headers.set("content-type", "text/html; charset=utf-8");
    return new Response(data, {
      status: finalStatus,
      headers: this._headers,
    });
  }

  /**
   * Build a redirect `Response` (default status 302).
   */
  redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 302): Response {
    this._headers.set("location", url);
    return new Response(null, {
      status,
      headers: this._headers,
    });
  }

  /** Convenience: get a single query parameter value. */
  queryParam(name: string): string | null {
    return this.url.searchParams.get(name);
  }

  /** Convenience: get a single header value (case-insensitive). */
  headerValue(name: string): string | null {
    return this.req.headers.get(name);
  }
}
