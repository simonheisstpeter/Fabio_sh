import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { getDb } from '../../lib/db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT = 3;        // max submissions
const RATE_WINDOW = 3600;    // per hour (seconds)
const MIN_SUBMIT_MS = 3000;  // min 3 s between page load and submit

function hashIp(ip: string): string {
  const secret = import.meta.env.IP_HASH_SECRET ?? process.env.IP_HASH_SECRET ?? 'changeme';
  return createHash('sha256').update(secret + ip).digest('hex');
}

function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

function silentOk(): Response {
  // Silently accept (honeypot / timing) — do NOT reveal we discarded it
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 422): Response {
  return new Response(JSON.stringify({ ok: false, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return errorResponse('Invalid form data');
  }

  // ── 1. Honeypot ──────────────────────────────────────────────────────────
  const honeypot = (data.get('website') ?? '') as string;
  if (honeypot.trim().length > 0) return silentOk();

  // ── 2. Timing check ──────────────────────────────────────────────────────
  const rawTs = (data.get('_t') ?? '') as string;
  const ts = parseInt(rawTs, 10);
  if (isNaN(ts) || Date.now() - ts < MIN_SUBMIT_MS) return silentOk();

  // ── 3. Validation ─────────────────────────────────────────────────────────
  const name    = ((data.get('name')    ?? '') as string).trim();
  const email   = ((data.get('email')   ?? '') as string).trim();
  const message = ((data.get('message') ?? '') as string).trim();

  if (!name || name.length < 2 || name.length > 100) {
    return errorResponse('Name must be 2–100 characters');
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return errorResponse('Please enter a valid email address');
  }
  if (!message || message.length < 10 || message.length > 2000) {
    return errorResponse('Message must be 10–2000 characters');
  }

  // ── 4. Rate limiting (SQLite) ─────────────────────────────────────────────
  const ip = getClientIp(request);
  const ipHash = hashIp(ip);

  const db = getDb();

  const existing = db
    .prepare('SELECT count, window_start FROM rate_limits WHERE ip_hash = ?')
    .get(ipHash) as { count: number; window_start: string } | undefined;

  if (existing) {
    const windowStart = new Date(existing.window_start).getTime();
    const elapsed = (Date.now() - windowStart) / 1000;

    if (elapsed < RATE_WINDOW) {
      if (existing.count >= RATE_LIMIT) {
        return errorResponse('Too many submissions. Please try again later.', 429);
      }
      db.prepare('UPDATE rate_limits SET count = count + 1 WHERE ip_hash = ?').run(ipHash);
    } else {
      // Window expired — reset
      db.prepare('UPDATE rate_limits SET count = 1, window_start = CURRENT_TIMESTAMP WHERE ip_hash = ?').run(ipHash);
    }
  } else {
    db.prepare('INSERT INTO rate_limits (ip_hash) VALUES (?)').run(ipHash);
  }

  // ── 5. Store submission ───────────────────────────────────────────────────
  db.prepare(
    'INSERT INTO contact_submissions (name, email, message, ip_hash) VALUES (?, ?, ?, ?)',
  ).run(name, email, message, ipHash);

  // ── 6. Respond ────────────────────────────────────────────────────────────
  // If the request accepts JSON (JS-enhanced), return JSON.
  // Otherwise redirect (no-JS plain form submit).
  const acceptsJson = request.headers.get('accept')?.includes('application/json') ?? false;
  const referer = request.headers.get('referer') ?? '/';
  const redirectUrl = new URL(referer);
  redirectUrl.searchParams.set('sent', '1');

  if (acceptsJson) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(null, {
    status: 303,
    headers: { Location: redirectUrl.pathname + '?' + redirectUrl.searchParams.toString() },
  });
};

// Block non-POST
export const GET: APIRoute = () =>
  new Response('Method not allowed', { status: 405 });
