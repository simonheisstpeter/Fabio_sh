import type { APIRoute } from 'astro';
import { hashPassword } from '../../../lib/password';
import { getDb } from '../../../lib/db';
import { validateSession } from '../../../lib/admin-auth';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/register' } });

export const POST: APIRoute = async ({ request, cookies }) => {
  const db = getDb();
  const authState = db.prepare(`
    SELECT (SELECT COUNT(*) FROM webauthn_credentials) as passkeys,
           (SELECT COUNT(*) FROM admin_password)        as passwords
  `).get() as { passkeys: number; passwords: number };

  // If any credentials already exist, require an active admin session.
  // Prevents unauthenticated actors from adding a password when a passkey is set.
  if ((authState.passkeys > 0 || authState.passwords > 0) && !validateSession(cookies)) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
  }

  if (authState.passwords > 0) {
    return new Response(null, { status: 302, headers: { Location: '/admin/register?error=exists' } });
  }

  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm_password') ?? '');

  if (!email || !password) {
    return new Response(null, { status: 302, headers: { Location: '/admin/register?error=missing' } });
  }
  if (password !== confirm) {
    return new Response(null, { status: 302, headers: { Location: '/admin/register?error=mismatch' } });
  }
  if (password.length < 12) {
    return new Response(null, { status: 302, headers: { Location: '/admin/register?error=short' } });
  }

  const hash = await hashPassword(password);
  db.prepare('INSERT INTO admin_password (id, email, hash) VALUES (1, ?, ?)').run(email, hash);

  return new Response(null, { status: 302, headers: { Location: '/admin/register?pw=set' } });
};
