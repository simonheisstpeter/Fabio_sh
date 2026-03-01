import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/register' } });

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const confirm = String(form.get('confirm_password') ?? '');

  if (!email || !password) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/register?error=missing' },
    });
  }

  if (password !== confirm) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/register?error=mismatch' },
    });
  }

  if (password.length < 12) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/register?error=short' },
    });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM admin_password WHERE id = 1').get();
  if (existing) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/register?error=exists' },
    });
  }

  const hash = await bcrypt.hash(password, 12);
  db.prepare('INSERT INTO admin_password (id, email, hash) VALUES (1, ?, ?)').run(email, hash);

  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/register?pw=set' },
  });
};
