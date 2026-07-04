/**
 * A translation dictionary: locale code → message key → translated string.
 */
export type TranslationDict = Record<string, Record<string, string>>;

/**
 * Configuration for the `localeDetect()` middleware.
 */
export interface LocaleConfig {
  /** Fallback locale if detection fails. Default: `"en"`. */
  default: string;
  /** List of supported locale codes. */
  supported: string[];
  /** Detection strategy priority. Default: `["header"]`. */
  strategies?: ("header" | "cookie" | "query" | "ip")[];
  /** Cookie name to inspect (only used if `"cookie"` is in strategies). */
  cookieName?: string;
  /** Query parameter name to inspect (only used if `"query"` is in strategies). */
  queryParam?: string;
}

/**
 * RTL languages. Extend this set via `addRtlLanguage()`.
 */
export const RTL_LANGUAGES = new Set([
  "ar", "arc", "dv", "fa", "ha", "he", "khw", "ks", "ku", "ps",
  "ur", "yi",
]);

/**
 * Register additional RTL languages.
 */
export function addRtlLanguage(code: string): void {
  RTL_LANGUAGES.add(code);
}
