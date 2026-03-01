import { randomBytes } from 'crypto';
import type { AstroCookies } from 'astro';
import { getDb } from './db';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function validateSession(cookies: AstroCookies): boolean {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const db = getDb();
  const row = db
    .prepare(
      `SELECT token FROM admin_sessions
       WHERE token = ? AND expires_at > CURRENT_TIMESTAMP`
    )
    .get(token);

  return row !== undefined;
}

export function createSession(cookies: AstroCookies): void {
  const token = randomBytes(32).toString('hex');
  const db = getDb();

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
    const db = getDb();
    db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
  }

  cookies.delete(COOKIE_NAME, { path: '/' });
}
