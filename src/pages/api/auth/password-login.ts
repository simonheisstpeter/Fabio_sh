import type { APIRoute } from 'astro';
import { verifyPassword, DUMMY_HASH } from '../../../lib/password';
import { getDb, hashIp } from '../../../lib/db';
import { createSession } from '../../../lib/admin-auth';
import { jsonError, jsonOk } from '../../../lib/response';

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/login' } });

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const form = await request.formData();

  // Honeypot + timing
  if (form.get('website')) return new Response(null, { status: 200 });
  const ts = Number(form.get('_t') ?? 0);
  if (ts && Date.now() - ts < 1000) return new Response(null, { status: 200 });

  const ipHash = hashIp(clientAddress ?? '');
  const db = getDb();

  // Rate limit
  const row = db
    .prepare('SELECT count, window_start FROM login_attempts WHERE ip_hash = ?')
    .get(ipHash) as { count: number; window_start: string } | undefined;

  if (row) {
    const expired = Date.now() - new Date(row.window_start + 'Z').getTime() > WINDOW_MINUTES * 60_000;
    if (!expired && row.count >= MAX_ATTEMPTS) return jsonError('Too many attempts. Try again later.', 429);
    if (expired) db.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').run(ipHash);
  }

  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return jsonError('Email and password required.', 400);

  const cred = db
    .prepare('SELECT email, hash FROM admin_password WHERE id = 1')
    .get() as { email: string; hash: string } | undefined;

  // Always run scrypt to prevent timing attacks
  const valid = await verifyPassword(password, cred?.hash ?? DUMMY_HASH);

  if (!valid || cred?.email !== email) {
    db.prepare(
      `INSERT INTO login_attempts (ip_hash, count, window_start) VALUES (?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(ip_hash) DO UPDATE SET count = count + 1`
    ).run(ipHash);
    return jsonError('Invalid credentials.', 401);
  }

  db.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').run(ipHash);
  createSession(cookies);
  return jsonOk();
};
