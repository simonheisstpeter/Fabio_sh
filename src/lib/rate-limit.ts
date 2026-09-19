import { getDb, hashIp } from "./db";

/**
 * Increment-and-check in a single statement.
 *
 * A `SELECT count` followed by `UPDATE count + 1` is a read-modify-write race:
 * two concurrent requests could both read a count under the limit and both
 * proceed. SQLite applies this UPSERT atomically, so the returned count is
 * authoritative.
 *
 * `key` should be namespaced per feature (see `rateLimitKeyFor`) so unrelated
 * limits don't share a counter.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): { allowed: boolean; count: number } {
  const expired = `(julianday('now') - julianday(window_start)) * 86400 >= ?`;

  const row = getDb()
    .prepare(
      `INSERT INTO rate_limits (ip_hash, count, window_start)
       VALUES (?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(ip_hash) DO UPDATE SET
         count        = CASE WHEN ${expired} THEN 1 ELSE count + 1 END,
         window_start = CASE WHEN ${expired} THEN CURRENT_TIMESTAMP ELSE window_start END
       RETURNING count`,
    )
    .get(key, windowSeconds, windowSeconds) as { count: number };

  maybePurge();
  return { allowed: row.count <= limit, count: row.count };
}

/** Forget a key — e.g. after a successful login. */
export function resetRateLimit(key: string): void {
  getDb().prepare("DELETE FROM rate_limits WHERE ip_hash = ?").run(key);
}

/**
 * The one place a client identity is derived. `clientAddress` is Astro's own
 * value: the socket peer, or the first `X-Forwarded-For` hop only when the
 * request host passes `security.allowedDomains`. Reading the header ourselves
 * would let anyone pick their own bucket.
 */
export function rateLimitKeyFor(clientAddress: string | undefined, namespace: string): string {
  return `${namespace}:${hashIp(clientAddress ?? "unknown")}`;
}

/**
 * `rate_limits` is the only table that would otherwise grow without bound —
 * one row per client, forever. Swept opportunistically instead of via a timer.
 */
const PURGE_EVERY = 50;
let calls = 0;

function maybePurge(olderThanSeconds = 86_400): void {
  if (++calls % PURGE_EVERY !== 0) return;
  getDb()
    .prepare(
      `DELETE FROM rate_limits
       WHERE (julianday('now') - julianday(window_start)) * 86400 >= ?`,
    )
    .run(olderThanSeconds);
}
