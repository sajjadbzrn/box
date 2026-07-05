# boxfw-i18n

[![npm version](https://badge.fury.io/js/boxfw-i18n.svg)](https://www.npmjs.com/package/boxfw-i18n)

Built-in **internationalization (i18n) and RTL support** for **Box Framework** — locale detection, bilingual error messages, and RTL metadata.

## Installation

```bash
bun add boxfw-i18n
```

> Requires `boxfw-core` as a peer dependency.

## Quick Start

```ts
import { Box } from "boxfw-core";
import { localeDetect, t, bilingualError } from "boxfw-i18n";

const app = new Box();

app.use(localeDetect({
  default: "en",
  supported: ["en", "fa", "ar"],
  strategies: ["header", "query"],
}));

app.get("/", (c) => {
  const greeting = t(c.locale, { en: "Hello", fa: "سلام" });
  return c.text(greeting);
});
```

## Features

- **Multi-strategy locale detection** — `Accept-Language` header, cookie, query parameter, IP (fallback)
- **Bilingual error messages** — `bilingualError()` returns localized error responses
- **RTL metadata** — `rtlMeta()` generates HTML `dir` and `lang` attributes; `isRtl()` for conditional rendering
- **Extensible** — register custom RTL languages with `addRtlLanguage()`

## API

```ts
// Middleware
app.use(localeDetect({ default: "en", supported: ["en", "fa"] }));

// Translation
t(locale, { en: "Hello", fa: "سلام" });

// Bilingual error
bilingualError(c, {
  en: { error: "Not found", message: "The resource was not found" },
  fa: { error: "پیدا نشد", message: "منبع مورد نظر یافت نشد" },
});

// RTL helpers
rtlMeta(locale);  // → { dir: "rtl", lang: "fa" }
isRtl(locale);    // → boolean
```

## License

MIT — see the [LICENSE](LICENSE) file for details.
