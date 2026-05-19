import { defineMiddleware } from "astro:middleware";
import { validateSession } from "./lib/admin-auth";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/register"];

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options":    "nosniff",
  "X-Frame-Options":           "DENY",
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":   CSP,
};

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const pathname = url.pathname;

  // Protect /api/admin/** — return 401 JSON (no redirect)
  if (pathname.startsWith("/api/admin/")) {
    if (!validateSession(cookies)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Protect /admin/** except login and register
  if (pathname.startsWith("/admin/") || pathname === "/admin") {
    const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isPublic && !validateSession(cookies)) return redirect("/admin/login");
  }

  const response = await next();

  // Fix Astro SSR i18n 302-with-no-Location bug + inject security headers on all responses
  const status =
    response.status === 302 && !response.headers.get("location") ? 200 : response.status;

  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }

  return new Response(response.body, { status, headers });
});
