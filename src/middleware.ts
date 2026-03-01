import { defineMiddleware } from 'astro:middleware';
import { validateSession } from './lib/admin-auth';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/register'];

export const onRequest = defineMiddleware(({ url, cookies, redirect }, next) => {
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
    if (!isPublic && !validateSession(cookies)) {
      return redirect('/admin/login');
    }
  }

  return next();
});
