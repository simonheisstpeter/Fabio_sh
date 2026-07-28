import { getDb, hashIp } from "./db";

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Increment-and-check in a single statement.
 *
 * The previous implementation did `SELECT count` then `UPDATE count + 1`, which
 * is a read-modify-write race: two concurrent requests could both read a count
 * under the limit and both proceed. SQLite applies this UPSERT atomically, so
 * the returned count is authoritative.
 *
 * `key` should be namespaced per feature (e.g. `"cv:"`) so unrelated limits
 * don't share a counter.
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

  return { allowed: row.count <= limit, count: row.count };
}

export function rateLimitKeyFor(request: Request, namespace = ""): string {
  return namespace + hashIp(getClientIp(request));
}

/**
 * `rate_limits` is the only table that would otherwise grow without bound —
 * one row per unique IP hash, forever. Called opportunistically on writes.
 */
export function purgeStaleRateLimits(olderThanSeconds = 86_400): void {
  getDb()
    .prepare(
      `DELETE FROM rate_limits
       WHERE (julianday('now') - julianday(window_start)) * 86400 >= ?`,
    )
    .run(olderThanSeconds);
}
