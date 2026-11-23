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
 * The client address rate limits are keyed on.
 *
 * Astro's `clientAddress` is the *left-most* `X-Forwarded-For` hop once the
 * Host passes `security.allowedDomains`. Behind a CDN that appends to the
 * header (Bunny does), that hop is whatever the visitor sent, so anyone could
 * pick a fresh bucket per request and brute-force the login.
 *
 * Set `CLIENT_IP_HEADER` to the header the edge itself writes (Bunny:
 * `x-real-ip`). Its right-most entry is used, i.e. the value the nearest
 * proxy appended. Only trust it when the container can't be reached around
 * the CDN. Unset, Astro's value is used as before.
 */
export function clientIp(request: Request, clientAddress: string | undefined): string | undefined {
  const header = process.env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (header) {
    const hops = (request.headers.get(header) ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (hops.length > 0) return hops[hops.length - 1];
  }
  return clientAddress;
}

/**
 * The one place a rate-limit key is derived. Pass `clientIp(...)`, never a
 * header read ad hoc: that would let anyone pick their own bucket.
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
