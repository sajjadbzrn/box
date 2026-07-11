import type { Middleware } from "boxfw-core";

export interface JwtOptions {
  /** Secret key for verifying tokens. */
  secret: string;
  /** Cookie name to read the token from (optional, defaults to reading Authorization header). */
  cookie?: string;
  /** If true, the request continues without error when token is missing (but c.jwt will be null). */
  optional?: boolean;
}

/**
 * JWT authentication middleware.
 *
 * Reads a JWT from the `Authorization: Bearer <token>` header
 * (or a named cookie), verifies it, and stores the decoded payload
 * on `c.jwt`.
 *
 * If `optional: true`, missing/invalid tokens don't short-circuit —
 * `c.jwt` will be `null` in that case.
 *
 * @example
 * ```ts
 * app.use(jwt({ secret: c.env("JWT_SECRET") ?? "dev-secret" }));
 *
 * app.get("/me", (c) => {
 *   const user = c.jwt; // { sub, iat, exp, ... }
 *   return c.json({ user });
 * });
 * ```
 */
export function jwt(options: JwtOptions): Middleware {
  return async (c, next) => {
    const token = extractToken(c, options);

    if (!token) {
      if (options.optional) {
        (c as Record<string, unknown>).jwt = null;
        return next();
      }
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    try {
      const payload = await verifyJwt(token, options.secret);
      (c as Record<string, unknown>).jwt = payload;
      return next();
    } catch {
      if (options.optional) {
        (c as Record<string, unknown>).jwt = null;
        return next();
      }
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  };
}

function extractToken(c: import("boxfw-core").Context, options: JwtOptions): string | null {
  if (options.cookie) {
    const cookies = c.req.headers.get("cookie") ?? "";
    const match = cookies.split(";").find((c) => c.trim().startsWith(`${options.cookie}=`));
    if (match) {
      const val = match.split("=")[1]?.trim();
      if (val) return val;
    }
  }

  const auth = c.req.headers.get("authorization") ?? "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  if (bearer?.[1]) return bearer[1];

  return null;
}

async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown>> {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error("Invalid token format");
  }

  // Verify signature using Web Crypto API (works on Bun + Workers)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "verify",
  ]);

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64ToBuf(signatureB64),
    encoder.encode(`${headerB64}.${payloadB64}`),
  );

  if (!valid) throw new Error("Invalid signature");

  const payload = JSON.parse(b64Decode(payloadB64));

  // Check expiration
  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw new Error("Token expired");
  }

  return payload;
}

function b64Decode(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

function b64ToBuf(str: string): ArrayBuffer {
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    buf[i] = bin.charCodeAt(i);
  }
  return buf.buffer;
}

/**
 * Create a signed JWT token (HS256).
 * Works on both Bun and Cloudflare Workers using Web Crypto API.
 */
export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encoder = new TextEncoder();
  const headerB64 = b64Encode(JSON.stringify(header));
  const payloadB64 = b64Encode(JSON.stringify(fullPayload));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);

  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);

  const sig = await crypto.subtle.sign("HMAC", key, data);
  const sigB64 = b64EncodeBuf(new Uint8Array(sig));

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

function b64Encode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64EncodeBuf(buf: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < buf.length; i++) {
    bin += String.fromCharCode(buf[i]!);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
