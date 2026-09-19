import type { APIContext } from "astro";
import { defineMiddleware } from "astro:middleware";
import { validateSession } from "./lib/admin-auth";
import { LOCALES } from "./i18n/locales.js";
import { jsonError } from "./lib/response";
import { MAX_REQUEST_BYTES } from "./lib/limits.js";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/register"];

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for state-changing requests. Browsers always send `Origin` on
 * cross-site POSTs, so a foreign (or opaque `null`) origin is refused. A missing
 * header means a non-browser client and is allowed — those carry no ambient
 * cookies to abuse. Accepts the request host *and* the canonical site host so
 * it keeps working behind a TLS-terminating proxy, which Astro's built-in
 * `checkOrigin` did not (hence it stays off in astro.config.mjs).
 */
function isForeignOrigin(request: Request, url: URL, site: URL | undefined): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return false;
  try {
    const host = new URL(origin).host;
    return host !== url.host && host !== site?.host;
  } catch {
    return true; // "null" and other opaque origins
  }
}

/**
 * Public pages that render the same for everyone. A short shared-cache window
 * lets a CDN absorb bursts; it's ignored (harmlessly) if there is none.
 * Anything that reads cookies (/cv, /admin) is deliberately absent.
 */
const CACHEABLE_PAGES = new Set(["/", "/about", "/projects", "/courses", "/contact", "/mediakit", "/social"]);
const PUBLIC_PAGE_CACHE = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

function isCacheablePage(pathname: string): boolean {
  const [, first, ...rest] = pathname.split("/");
  const path = "/" + (LOCALES.includes(first) ? rest : [first, ...rest]).join("/");
  return CACHEABLE_PAGES.has(path.length > 1 ? path.replace(/\/$/, "") : path);
}

function buildCSP(frameAncestors: "'none'" | "'self'") {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://analytics.diedigitale.at",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: https://images.unsplash.com https://*.googleusercontent.com",
    "connect-src 'self' https://analytics.diedigitale.at",
    "frame-src 'self'",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}
function makeSecurityHeaders(frameAncestors: "'none'" | "'self'") {
  return {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": frameAncestors === "'self'" ? "SAMEORIGIN" : "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": buildCSP(frameAncestors),
  };
}

/**
 * Requests that must never reach a page or endpoint. Returns the refusal, or
 * `undefined` to let the request through.
 */
function guard(
  { url, cookies, redirect, request, site }: Pick<APIContext, "url" | "cookies" | "redirect" | "request" | "site">,
): Response | undefined {
  const { pathname } = url;

  if (!SAFE_METHODS.has(request.method)) {
    if (isForeignOrigin(request, url, site)) {
      return jsonError("Cross-origin request blocked", 403);
    }
    // The adapter also enforces this while streaming, but only by throwing
    // (a 500). Declared oversize bodies get a proper 413 before any handler runs.
    if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
      return jsonError("Request too large", 413);
    }
  }

  // Protect /api/admin/** — return 401 JSON (no redirect)
  if (pathname.startsWith("/api/admin/") && !validateSession(cookies)) {
    return jsonError("Unauthorized", 401);
  }

  // Protect /admin/** except login and register
  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isPublic && !validateSession(cookies)) return redirect("/admin/login");
  }

  return undefined;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  const pathname = url.pathname;

  // Refusals go through the same header pass below — a bare 401/403/413 used
  // to leave without CSP, nosniff or HSTS.
  const response = guard(context) ?? (await next());

  // Fix Astro SSR i18n 302-with-no-Location bug + inject security headers on all responses
  const status =
    response.status === 302 && !response.headers.get("location") ? 200 : response.status;

  // /api/cv/file is served inside a same-origin <iframe> — allow self-framing only there
  const frameAncestors = pathname === "/api/cv/file" ? "'self'" : "'none'";

  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(makeSecurityHeaders(frameAncestors))) {
    headers.set(k, v);
  }

  if (
    request.method === "GET" &&
    status === 200 &&
    !headers.has("Cache-Control") &&
    headers.getSetCookie().length === 0 &&
    headers.get("Content-Type")?.includes("text/html") &&
    isCacheablePage(pathname)
  ) {
    headers.set("Cache-Control", PUBLIC_PAGE_CACHE);
  }

  return new Response(response.body, { status, headers });
});
