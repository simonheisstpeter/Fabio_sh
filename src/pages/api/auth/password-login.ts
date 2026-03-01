import type { APIRoute } from 'astro';
import bcrypt from 'bcryptjs';
import { getDb, hashIp } from '../../../lib/db';
import { createSession } from '../../../lib/admin-auth';

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/login' } });

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const form = await request.formData();

  // 1. Honeypot
  if (form.get('website')) {
    return new Response(null, { status: 200 });
  }

  // 2. Timing check
  const ts = Number(form.get('_t') ?? 0);
  if (ts && Date.now() - ts < 1000) {
    return new Response(null, { status: 200 });
  }

  const ipHash = hashIp(clientAddress ?? '');
  const db = getDb();

  // 3. Rate limit check
  const row = db
    .prepare(`SELECT count, window_start FROM login_attempts WHERE ip_hash = ?`)
    .get(ipHash) as { count: number; window_start: string } | undefined;

  if (row) {
    const windowStart = new Date(row.window_start + 'Z').getTime();
    const expired = Date.now() - windowStart > WINDOW_MINUTES * 60 * 1000;
    if (!expired && row.count >= MAX_ATTEMPTS) {
      return new Response(JSON.stringify({ error: 'Too many attempts. Try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (expired) {
      db.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').run(ipHash);
    }
  }

  // 4. Validate fields
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Email and password required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 5. Lookup credential
  const cred = db
    .prepare('SELECT email, hash FROM admin_password WHERE id = 1')
    .get() as { email: string; hash: string } | undefined;

  const dummyHash = '$2b$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn';
  const hashToCompare = cred?.hash ?? dummyHash;

  const valid = await bcrypt.compare(password, hashToCompare);
  const emailMatch = cred?.email === email;

  if (!valid || !emailMatch) {
    // Increment attempt counter
    db.prepare(
      `INSERT INTO login_attempts (ip_hash, count, window_start)
       VALUES (?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(ip_hash) DO UPDATE SET count = count + 1`
    ).run(ipHash);

    return new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 6. Success — clear attempt counter and create session
  db.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').run(ipHash);
  createSession(cookies);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
