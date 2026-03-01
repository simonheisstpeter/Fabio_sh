import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: 'https://fabio.sh',

  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en', 'es', 'it', 'ja', 'pt'],
    routing: {
      prefixDefaultLocale: false,
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
