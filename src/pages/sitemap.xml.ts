import type { APIRoute } from 'astro';
import { LOCALES, DEFAULT_LOCALE } from '../i18n/locales.js';

const PAGES = ['', 'about', 'contact', 'projects', 'mediakit'];

function urls(site: URL): string[] {
  const result: string[] = [];
  for (const locale of LOCALES) {
    const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
    for (const page of PAGES) {
      result.push(new URL(`${prefix}/${page}`, site).href.replace(/\/$/, '') || site.href);
    }
  }
  return [...new Set(result)];
}

export const GET: APIRoute = ({ site }) => {
  const entries = urls(site!).map(
    (url) => `  <url><loc>${url}</loc></url>`
  ).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
