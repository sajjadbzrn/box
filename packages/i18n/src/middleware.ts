import type { Middleware } from "boxfw-core";
import { detectLocale } from "./resolver";
import type { LocaleConfig } from "./types";

/**
 * Middleware that detects the request locale and sets `c.locale`.
 *
 * Detection strategies (checked in order):
 * - `"header"` — `Accept-Language` header
 * - `"cookie"` — named cookie value
 * - `"query"` — URL query parameter
 * - `"ip"` — IP-based geolocation (placeholder — always falls back to default)
 *
 * @example
 * ```ts
 * app.use(localeDetect({
 *   default: "en",
 *   supported: ["en", "fa", "ar"],
 *   strategies: ["header", "query"],
 * }));
 *
 * app.get("/", (c) => c.json({ locale: c.locale }));
 * ```
 */
export function localeDetect(config: LocaleConfig): Middleware {
  const strategies = config.strategies ?? ["header"];

  return async (c, next) => {
    const locale = detectLocale(c, config, strategies);
    c.locale = locale;
    return next();
  };
}
