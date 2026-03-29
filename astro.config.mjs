import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { LOCALES, DEFAULT_LOCALE } from './src/i18n/locales.js';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: 'https://fabio.sh',
  security: {
    checkOrigin: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALES,
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
    fallback: {
      en: DEFAULT_LOCALE,
      es: DEFAULT_LOCALE,
      eo: DEFAULT_LOCALE,
      'fr-FR': DEFAULT_LOCALE,
      he: DEFAULT_LOCALE,
      it: DEFAULT_LOCALE,
      ja: DEFAULT_LOCALE,
      la: DEFAULT_LOCALE,
      nl: DEFAULT_LOCALE,
      pt: DEFAULT_LOCALE,
      uk: DEFAULT_LOCALE,
      zh: DEFAULT_LOCALE,
      'en-x-corp': DEFAULT_LOCALE,
      'en-x-leet': DEFAULT_LOCALE,
      'en-x-min': DEFAULT_LOCALE,
      'en-x-cyberpunk': DEFAULT_LOCALE,
    },
  },
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});
