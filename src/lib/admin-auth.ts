import { createHash, randomBytes } from "node:crypto";
import type { AstroCookies } from "astro";
import { getDb } from "./db";

const COOKIE_NAME = "admin_session";
const CHALLENGE_COOKIE = "__wac";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const CHALLENGE_TTL_SECONDS = 300;
const CACHE_TTL_MS = 30_000; // re-validate against DB every 30 s

/** Shared by every auth-related cookie so the flags can't drift apart. */
export function secureCookie(maxAge?: number) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: import.meta.env.PROD,
    path: "/",
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

/** Only the digest is stored, so a leaked DB or backup holds no usable session. */
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

// session digest → cache expiry timestamp
const sessionCache = new Map<string, number>();

export function validateSession(cookies: AstroCookies): boolean {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const key = digest(token);
  const cached = sessionCache.get(key);
  if (cached !== undefined && cached > Date.now()) return true;

  const row = getDb()
    .prepare(
      `SELECT token FROM admin_sessions
       WHERE token = ? AND expires_at > CURRENT_TIMESTAMP`,
    )
    .get(key);

  if (row) {
    sessionCache.set(key, Date.now() + CACHE_TTL_MS);
    return true;
  }

  sessionCache.delete(key);
  return false;
}

export function createSession(cookies: AstroCookies): void {
  const token = randomBytes(32).toString("hex");
  const db = getDb();

  // Purge expired sessions on each new login
  db.prepare(`DELETE FROM admin_sessions WHERE expires_at <= CURRENT_TIMESTAMP`).run();

  db.prepare(
    `INSERT INTO admin_sessions (token, expires_at)
     VALUES (?, datetime('now', '+7 days'))`,
  ).run(digest(token));

  cookies.set(COOKIE_NAME, token, secureCookie(SESSION_TTL_SECONDS));
}

export function deleteSession(cookies: AstroCookies): void {
  const token = cookies.get(COOKIE_NAME)?.value;
  if (token) {
    const key = digest(token);
    sessionCache.delete(key);
    getDb().prepare("DELETE FROM admin_sessions WHERE token = ?").run(key);
  }

  cookies.delete(COOKIE_NAME, { path: "/" });
}

// ── Credential enrolment ────────────────────────────────────────────────────

export function credentialCounts(): { passkeys: number; passwords: number } {
  return getDb()
    .prepare(
      `SELECT (SELECT COUNT(*) FROM webauthn_credentials) AS passkeys,
              (SELECT COUNT(*) FROM admin_password)        AS passwords`,
    )
    .get() as { passkeys: number; passwords: number };
}

/**
 * Enrolling a credential is only open to whoever is already signed in — or to
 * anyone while *no* credential exists yet (first-run bootstrap). Once either a
 * passkey or a password is set, an anonymous visitor must not be able to add
 * their own.
 */
export function canEnrolCredential(cookies: AstroCookies): boolean {
  if (validateSession(cookies)) return true;
  const { passkeys, passwords } = credentialCounts();
  return passkeys === 0 && passwords === 0;
}

// ── WebAuthn challenges ─────────────────────────────────────────────────────
// Stored server-side and consumed exactly once. The cookie only carries an
// opaque id, so a client can neither choose its own challenge nor replay one.

export type ChallengePurpose = "register" | "login";

export function issueChallenge(
  cookies: AstroCookies,
  challenge: string,
  purpose: ChallengePurpose,
): void {
  const db = getDb();
  const id = randomBytes(24).toString("hex");

  db.prepare("DELETE FROM auth_challenges WHERE expires_at <= CURRENT_TIMESTAMP").run();
  db.prepare(
    `INSERT INTO auth_challenges (id, challenge, purpose, expires_at)
     VALUES (?, ?, ?, datetime('now', '+${CHALLENGE_TTL_SECONDS} seconds'))`,
  ).run(id, challenge, purpose);

  cookies.set(CHALLENGE_COOKIE, id, secureCookie(CHALLENGE_TTL_SECONDS));
}

/** Returns the challenge and burns it; `null` if missing, expired or reused. */
export function consumeChallenge(cookies: AstroCookies, purpose: ChallengePurpose): string | null {
  const id = cookies.get(CHALLENGE_COOKIE)?.value;
  cookies.delete(CHALLENGE_COOKIE, { path: "/" });
  if (!id) return null;

  const row = getDb()
    .prepare(
      `DELETE FROM auth_challenges
       WHERE id = ? AND purpose = ? AND expires_at > CURRENT_TIMESTAMP
       RETURNING challenge`,
    )
    .get(id, purpose) as { challenge: string } | undefined;

  return row?.challenge ?? null;
}
