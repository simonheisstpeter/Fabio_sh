import type { APIRoute } from "astro";
import { LOCALES, DEFAULT_LOCALE } from "../i18n/locales.js";

/**
 * Indexable pages. Deliberately excludes:
 *   /cv      — access-gated, and disallowed in robots.txt
 *   /test    — unlinked scratch page for Hero variants
 *   /docs/*  — personal notes, linkable but not for the index
 */
const PAGES = ["", "about", "contact", "projects", "social", "courses", "mediakit"];

/**
 * The `en-x-*` locales are novelty translations (Cowboy, Leet, …) of the same
 * English content. Listing all nine would publish near-duplicate variants of
 * every page, and `hreflang="en-x-cowboy"` means nothing to a search engine —
 * so they stay reachable for humans but out of the sitemap.
 */
const INDEXABLE_LOCALES = LOCALES.filter((l) => !l.startsWith("en-x-"));

function pageUrl(site: URL, locale: string, page: string): string {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  const href = new URL(`${prefix}/${page}`, site).href.replace(/\/$/, "");
  return href || site.href;
}

export const GET: APIRoute = ({ site }) => {
  const base = site!;

  const entries = INDEXABLE_LOCALES.flatMap((locale) =>
    PAGES.map((page) => {
      // Every URL advertises all its locale siblings, so the variants are
      // understood as translations rather than duplicate content.
      const alternates = INDEXABLE_LOCALES.map(
        (alt) =>
          `    <xhtml:link rel="alternate" hreflang="${alt}" href="${pageUrl(base, alt, page)}"/>`,
      ).join("\n");

      return [
        "  <url>",
        `    <loc>${pageUrl(base, locale, page)}</loc>`,
        alternates,
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(base, DEFAULT_LOCALE, page)}"/>`,
        "  </url>",
      ].join("\n");
    }),
  ).join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
