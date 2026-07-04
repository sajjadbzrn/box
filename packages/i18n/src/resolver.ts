import type { Context } from "boxfw-core";
import type { LocaleConfig } from "./types";

/**
 * Run locale detection strategies in order and return the first match.
 */
export function detectLocale(
  c: Context,
  config: LocaleConfig,
  strategies: NonNullable<LocaleConfig["strategies"]>,
): string {
  for (const strategy of strategies) {
    const result = tryStrategy(c, config, strategy);
    if (result) return result;
  }
  return config.default;
}

function tryStrategy(c: Context, config: LocaleConfig, strategy: string): string | null {
  switch (strategy) {
    case "header":
      return parseAcceptLanguage(c.req.headers.get("accept-language") ?? "", config.supported);
    case "cookie":
      return parseSimpleValue(c.req.headers.get("cookie") ?? "", config.cookieName ?? "locale", config.supported);
    case "query":
      return parseSimpleValue(c.url.search, config.queryParam ?? "lang", config.supported);
    case "ip":
      return null; // Placeholder — IP geolocation requires external service
    default:
      return null;
  }
}

/**
 * Parse the `Accept-Language` header and return the best matching supported locale.
 */
function parseAcceptLanguage(header: string, supported: string[]): string | null {
  if (!header) return null;

  const locales = header
    .split(",")
    .map((part) => {
      const [code, qRaw] = part.trim().split(";q=");
      return {
        code: code?.split("-")[0]?.toLowerCase() ?? "",
        q: qRaw ? parseFloat(qRaw) : 1.0,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { code } of locales) {
    if (supported.includes(code)) return code;
    // Also check full locale code (e.g., "en-US" → "en")
  }

  return null;
}

/**
 * Extract a locale value from a cookie header string or query string.
 */
function parseSimpleValue(source: string, name: string, supported: string[]): string | null {
  if (!source) return null;
  const val = extractParam(source, name);
  if (val && supported.includes(val)) return val;
  return null;
}

function extractParam(source: string, name: string): string | null {
  if (source.startsWith("?")) {
    // Query string
    const params = new URLSearchParams(source);
    return params.get(name);
  }
  // Cookie header
  const cookies = source.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");
    if (key?.trim() === name) {
      return rest.join("=")?.trim() ?? null;
    }
  }
  return null;
}
