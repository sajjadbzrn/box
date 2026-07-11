import type { Context } from "boxfw-core";
import type { TranslationDict } from "./types";

/**
 * Translate a message key to the current request locale.
 *
 * @example
 * ```ts
 * const dict: TranslationDict = {
 *   en: { hello: "Hello", goodbye: "Goodbye" },
 *   fa: { hello: "سلام", goodbye: "خداحافظ" },
 * };
 *
 * app.get("/greet", (c) => c.text(t(c, "hello", dict)));
 * ```
 */
export function t(c: Context, key: string, dict: TranslationDict): string {
  const locale = c.locale;
  const fallback = Object.keys(dict)[0] ?? "en";
  return dict[locale]?.[key] ?? dict[fallback]?.[key] ?? key;
}

/**
 * Return a bilingual error response.
 *
 * @example
 * ```ts
 * app.get("/item/:id", (c) => {
 *   const item = findItem(c.params.id);
 *   if (!item) return bilingualError(c, "not_found", dict, 404);
 *   return c.json(item);
 * });
 * ```
 */
export function bilingualError(c: Context, key: string, dict: TranslationDict, status = 400): Response {
  const message = t(c, key, dict);
  return c.status(status).json({ error: message });
}
