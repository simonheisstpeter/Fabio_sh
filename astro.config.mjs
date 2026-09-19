import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { LOCALES, DEFAULT_LOCALE } from "./src/i18n/locales.js";
import mailObfuscation from "astro-mail-obfuscation";
import { MAX_REQUEST_BYTES } from "./src/lib/limits.js";

export default defineConfig({
  output: "server",
  // Uploads are capped at 10 MB (see lib/limits.js); the adapter default is 1 GB,
  // which lets any anonymous POST make the server buffer that much.
  adapter: node({ mode: "standalone", bodySizeLimit: MAX_REQUEST_BYTES }),
  site: "https://fabio.sh",
  security: {
    // Astro's built-in origin check compares against the internal (http) URL
    // behind the proxy, so CSRF is enforced in src/middleware.ts instead.
    checkOrigin: false,
    // Only with a validated host does Astro trust X-Forwarded-For for
    // `clientAddress`. Without this every visitor looks like the proxy, and
    // per-client rate limits collapse into one shared bucket.
    allowedDomains: [{ hostname: "fabio.sh" }, { hostname: "www.fabio.sh" }],
  },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALES,
    routing: {
      prefixDefaultLocale: false,
      fallbackType: "rewrite",
    },
    fallback: {
      en: DEFAULT_LOCALE,
      es: DEFAULT_LOCALE,
      eo: DEFAULT_LOCALE,
      fr: DEFAULT_LOCALE,
      he: DEFAULT_LOCALE,
      it: DEFAULT_LOCALE,
      ja: DEFAULT_LOCALE,
      la: DEFAULT_LOCALE,
      nl: DEFAULT_LOCALE,
      pt: DEFAULT_LOCALE,
      sv: DEFAULT_LOCALE,
      uk: DEFAULT_LOCALE,
      zh: DEFAULT_LOCALE,
      "en-x-corp": DEFAULT_LOCALE,
      "en-x-leet": DEFAULT_LOCALE,
      "en-x-min": DEFAULT_LOCALE,
      "en-x-cyberpunk": DEFAULT_LOCALE,
      "en-x-starwars": DEFAULT_LOCALE,
      "en-x-aislop": DEFAULT_LOCALE,
      "en-x-nasa": DEFAULT_LOCALE,
      "en-x-brainrot": DEFAULT_LOCALE,
      "en-x-cowboy": DEFAULT_LOCALE,
    },
  },
  // Security headers live in src/middleware.ts (single source of truth).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [mailObfuscation()],
});
