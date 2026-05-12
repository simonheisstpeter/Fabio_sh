import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapURL: URL) => `\
User-agent: *
Allow: /
Disallow: /test
Disallow: /admin
Disallow: /cv

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap.xml", site);
  return new Response(getRobotsTxt(sitemapURL));
};
