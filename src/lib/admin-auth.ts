import { randomBytes } from 'crypto';
import type { AstroCookies } from 'astro';
import { getDb } from './db';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const CACHE_TTL_MS = 30_000; // re-validate against DB every 30 s

// token → cache expiry timestamp
const sessionCache = new Map<string, number>();

export function validateSession(cookies: AstroCookies): boolean {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const cached = sessionCache.get(token);
  if (cached !== undefined && cached > Date.now()) return true;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT token FROM admin_sessions
       WHERE token = ? AND expires_at > CURRENT_TIMESTAMP`
    )
    .get(token);

  if (row) {
    sessionCache.set(token, Date.now() + CACHE_TTL_MS);
    return true;
  }

  sessionCache.delete(token);
  return false;
}

export function createSession(cookies: AstroCookies): void {
  const token = randomBytes(32).toString('hex');
  const db = getDb();

  // Purge expired sessions on each new login
  db.prepare(`DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP`).run();

  db.prepare(
    `INSERT INTO admin_sessions (token, expires_at)
     VALUES (?, datetime('now', '+7 days'))`
  ).run(token);

  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  });
}

export function deleteSession(cookies: AstroCookies): void {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (token) {
    sessionCache.delete(token);
    const db = getDb();
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }

  cookies.delete(COOKIE_NAME, { path: '/' });
}
