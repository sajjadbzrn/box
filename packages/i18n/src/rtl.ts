import { RTL_LANGUAGES } from "./types";

/**
 * Check if a locale code uses right-to-left (RTL) direction.
 */
export function isRtl(locale: string): boolean {
  return RTL_LANGUAGES.has(locale.split("-")[0] ?? locale);
}

/**
 * Generate RTL metadata for a serialized response.
 *
 * Returns `dir: "rtl" | "ltr"` and the `locale` so consumers
 * (e.g., a React/Vue frontend) can render accordingly.
 *
 * @example
 * ```ts
 * app.get("/data", (c) => {
 *   return c.json({
 *     ...rtlMeta(c.locale),
 *     items: getItems(),
 *   });
 * });
 * // → { dir: "rtl", locale: "fa", items: [...] }
 * ```
 */
export function rtlMeta(locale: string): { dir: "rtl" | "ltr"; locale: string } {
  return {
    dir: isRtl(locale) ? "rtl" : "ltr",
    locale,
  };
}
