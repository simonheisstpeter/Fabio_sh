import { DatabaseSync } from "node:sqlite";
import { existsSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { MAX_UPLOAD_BYTES } from "./limits.js";

const SQLITE_MAGIC = "SQLite format 3\u0000";
const REQUIRED_TABLES = [
  "admin_password",
  "contact_submissions",
  "projects",
  "schema_migrations",
];

/**
 * The restore route is a no-op unless this env var holds a long random token.
 * Unset (or a placeholder value) means the endpoint answers 404 — as if the
 * feature did not exist. Remove the variable after migrating and it locks
 * itself again.
 */
export function importToken(): string | null {
  const token = process.env.DB_IMPORT_TOKEN;
  if (token && token !== "changeme" && token.length >= 16) return token;
  return null;
}

export function isSqliteFile(buffer: Buffer): boolean {
  return buffer.length >= 100 && buffer.subarray(0, 16).toString("latin1") === SQLITE_MAGIC;
}

export type RestoreResult =
  | { ok: true; size: number; backupPath: string | null }
  | { ok: false; error: string };

/**
 * Atomically replaces the database at `dbPath` with an uploaded SQLite file.
 * The upload is validated first (magic bytes, size, integrity check, required
 * tables) and written next to the target before any rename happens, so a bad
 * file never touches the live DB. The previous DB is kept as
 * `fabio.db.pre-import-<timestamp>` next to it.
 */
export function restoreDatabase(buffer: Buffer, dbPath: string): RestoreResult {
  if (!isSqliteFile(buffer)) return { ok: false, error: "Not a SQLite database" };
  if (buffer.length > MAX_UPLOAD_BYTES) return { ok: false, error: "Database too large (max 10 MB)" };

  const tmpPath = `${dbPath}.importing-${Date.now()}`;
  writeFileSync(tmpPath, buffer);
  for (const side of [`${tmpPath}-wal`, `${tmpPath}-shm`]) {
    if (existsSync(side)) unlinkSync(side);
  }

  try {
    const db = new DatabaseSync(tmpPath, { readOnly: true });
    db.exec("PRAGMA case_sensitive_like = ON"); // noop probe: throws on garbage
    const integrity = db.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
    const tables = new Set(
      (
        db
          .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
          .all() as { name: string }[]
      ).map((r) => r.name),
    );
    db.close();

    if (integrity?.integrity_check !== "ok") {
      unlinkSync(tmpPath);
      return { ok: false, error: "Database failed the integrity check" };
    }
    const missing = REQUIRED_TABLES.filter((t) => !tables.has(t));
    if (missing.length > 0) {
      unlinkSync(tmpPath);
      return { ok: false, error: `Not a fabio.sh database (missing: ${missing.join(", ")})` };
    }
  } catch {
    if (existsSync(tmpPath)) unlinkSync(tmpPath);
    return { ok: false, error: "Database could not be opened and verified" };
  }

  let backupPath: string | null = null;
  if (existsSync(dbPath)) {
    backupPath = `${dbPath}.pre-import-${new Date().toISOString().replace(/:/g, "-").slice(0, 19)}`;
    renameSync(dbPath, backupPath);
    for (const side of [`${dbPath}-wal`, `${dbPath}-shm`]) {
      if (existsSync(side)) unlinkSync(side);
    }
  }
  renameSync(tmpPath, dbPath);

  return { ok: true, size: statSync(dbPath).size, backupPath };
}
