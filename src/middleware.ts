import { defineMiddleware } from 'astro:middleware';
import { validateSession } from './lib/admin-auth';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/register'];

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  const pathname = url.pathname;

  // Protect /api/admin/** — return 401 JSON (no redirect)
  if (pathname.startsWith('/api/admin/')) {
    if (!validateSession(cookies)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Protect /admin/** except login and register
  if (pathname.startsWith('/admin/') || pathname === '/admin') {
    const isPublic = PUBLIC_ADMIN_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    );
    if (!isPublic && !validateSession(cookies)) return redirect('/admin/login');
  }

  const response = await next();

  // Astro SSR i18n fallback emits 302 with body but no Location header.
  // Convert to 200 so browsers and crawlers treat it as a normal page.
  if (response.status === 302 && !response.headers.get('location')) {
    return new Response(response.body, { status: 200, headers: response.headers });
  }

  return response;
});
