import type { Middleware } from "boxfw-core";

export interface SessionOptions {
  /** Cookie name for the session. Default: `"sid"`. */
  cookieName?: string;
  /** Session duration in seconds. Default: `86400` (24 hours). */
  ttl?: number;
  /** Custom session store. Defaults to in-memory (per-process). */
  store?: SessionStore;
  /** If true, the request continues without a session (c.session will be null). */
  optional?: boolean;
}

export interface SessionStore {
  get(sid: string): Promise<Record<string, unknown> | null>;
  set(sid: string, data: Record<string, unknown>, ttl: number): Promise<void>;
  del(sid: string): Promise<void>;
}

/**
 * In-memory session store. Suitable for development.
 * For production, replace with a Redis/DB-backed store.
 */
export function memoryStore(): SessionStore {
  const store = new Map<string, { data: Record<string, unknown>; expires: number }>();

  return {
    async get(sid) {
      const entry = store.get(sid);
      if (!entry || entry.expires < Date.now()) {
        store.delete(sid);
        return null;
      }
      return entry.data;
    },
    async set(sid, data, ttl) {
      store.set(sid, { data, expires: Date.now() + ttl * 1000 });
    },
    async del(sid) {
      store.delete(sid);
    },
  };
}

function generateSid(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let sid = "";
  for (let i = 0; i < 32; i++) {
    sid += chars[Math.floor(Math.random() * chars.length)];
  }
  return sid;
}

/**
 * Session middleware.
 *
 * Manages cookie-based sessions. On first request without a cookie,
 * a new session is created. The session data is accessible via `c.session`.
 *
 * @example
 * ```ts
 * app.use(session());
 *
 * app.post("/login", async (c) => {
 *   const body = await c.req.json();
 *   // Verify credentials...
 *   c.session = { userId: "42", role: "admin" };
 *   return c.json({ ok: true });
 * });
 *
 * app.get("/me", (c) => {
 *   const user = c.session; // { userId, role }
 *   return c.json({ user });
 * });
 * ```
 */
export function session(options: SessionOptions = {}): Middleware {
  const cookieName = options.cookieName ?? "sid";
  const ttl = options.ttl ?? 86400;
  const store = options.store ?? memoryStore();

  return async (c, next) => {
    const sid = parseCookie(c.req.headers.get("cookie") ?? "", cookieName);

    if (sid) {
      const data = await store.get(sid);
      if (data) {
        (c as Record<string, unknown>).session = data;

        const res = await next();
        // Set session cookie on response
        res.headers.set("set-cookie", `${cookieName}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}`);
        return res;
      }
    }

    if (options.optional) {
      (c as Record<string, unknown>).session = null;
      return next();
    }

    // Create new session
    const newSid = generateSid();
    const newData: Record<string, unknown> = {};
    await store.set(newSid, newData, ttl);
    (c as Record<string, unknown>).session = newData;
    (c as Record<string, unknown>).__sid = newSid;

    const res = await next();

    // Persist any session changes and set cookie
    const updatedData = (c as Record<string, unknown>).session as Record<string, unknown>;
    await store.set(newSid, updatedData, ttl);

    res.headers.set("set-cookie", `${cookieName}=${newSid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}`);
    return res;
  };
}

function parseCookie(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key?.trim() === name) {
      return rest.join("=")?.trim() ?? null;
    }
  }
  return null;
}
