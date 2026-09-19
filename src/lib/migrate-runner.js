import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { MIGRATIONS } from "./migrations.js";

/** @typedef {import("node:sqlite").DatabaseSync} DatabaseSync */

function ensureMigrationsTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

/** @param {DatabaseSync} db */
function appliedIds(db) {
  return new Set(
    /** @type {{id: number}[]} */ (db.prepare("SELECT id FROM schema_migrations").all()).map(
      (r) => r.id,
    ),
  );
}

/** @param {DatabaseSync} db */
export function pendingMigrations(db) {
  ensureMigrationsTable(db);
  const applied = appliedIds(db);
  return MIGRATIONS.filter((m) => !applied.has(m.id));
}

/** @param {DatabaseSync} db */
export function migrationStatus(db) {
  ensureMigrationsTable(db);
  const applied = new Map(
    /** @type {{id: number, name: string, applied_at: string}[]} */ (
      db.prepare("SELECT id, name, applied_at FROM schema_migrations ORDER BY id").all()
    ).map((r) => [r.id, r]),
  );
  return MIGRATIONS.map((m) => ({
    id: m.id,
    name: m.name,
    applied: applied.has(m.id),
    appliedAt: applied.get(m.id)?.applied_at ?? null,
  }));
}

/**
 * Snapshot the database next to itself before the first pending migration.
 * `VACUUM INTO` cannot run inside a transaction, so this happens up front.
 * Returns the backup path, or null when there was nothing worth backing up.
 */
function backupBeforeMigrating(db, dbPath) {
  if (!dbPath || !existsSync(dbPath) || statSync(dbPath).size === 0) return null;

  // A brand-new database has nothing worth snapshotting. The file exists as
  // soon as it's opened, so size alone isn't enough — and `schema_migrations`
  // is created before we get here, so it must not count as real data.
  const userTables = /** @type {{n: number}} */ (
    db
      .prepare(
        `SELECT COUNT(*) n FROM sqlite_master
         WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name <> 'schema_migrations'`,
      )
      .get()
  ).n;
  if (userTables === 0) return null;

  const dir = join(dirname(dbPath), "backups");
  mkdirSync(dir, { recursive: true });
  const target = join(dir, `pre-migration-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);

  // Escape single quotes — the path is ours, but VACUUM INTO takes a literal.
  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  pruneBackups(dir);
  return target;
}

/** Snapshots would otherwise pile up forever, one per migration. */
const KEEP_BACKUPS = 5;

function pruneBackups(dir) {
  // ISO timestamps in the name sort chronologically.
  const stale = readdirSync(dir)
    .filter((f) => f.startsWith("pre-migration-") && f.endsWith(".db"))
    .sort()
    .slice(0, -KEEP_BACKUPS);
  for (const f of stale) rmSync(join(dir, f), { force: true });
}

/**
 * Applies pending migrations in order, each in its own transaction.
 *
 * `BEGIN IMMEDIATE` takes the write lock up front, and the applied-check is
 * repeated inside the transaction, so two processes starting at once cannot
 * apply the same migration twice. A failure rolls back that migration and
 * aborts the run — earlier ones stay committed and recorded.
 *
 * @param {DatabaseSync} db
 * @param {{ dbPath?: string, backup?: boolean, log?: (msg: string) => void }} [opts]
 */
export function runMigrations(db, opts = {}) {
  const { dbPath, backup = true, log = () => {} } = opts;

  ensureMigrationsTable(db);
  const pending = pendingMigrations(db);
  if (pending.length === 0) return { applied: [], backupPath: null };

  log(`[db] ${pending.length} pending migration(s): ${pending.map((m) => m.id).join(", ")}`);

  let backupPath = null;
  if (backup) {
    try {
      backupPath = backupBeforeMigrating(db, dbPath);
      if (backupPath) log(`[db] backup written to ${backupPath}`);
    } catch (err) {
      // A failed backup must not silently proceed with a schema change.
      throw new Error(
        `refusing to migrate: backup failed (${err instanceof Error ? err.message : err})`,
      );
    }
  }

  const applied = [];
  for (const migration of pending) {
    db.exec("BEGIN IMMEDIATE");
    try {
      // Re-check under the write lock in case another process just applied it.
      const already = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get(migration.id);
      if (already) {
        db.exec("COMMIT");
        continue;
      }

      migration.up(db);
      db.prepare("INSERT INTO schema_migrations (id, name) VALUES (?, ?)").run(
        migration.id,
        migration.name,
      );
      db.exec("COMMIT");

      applied.push(migration);
      log(`[db] applied ${migration.id}_${migration.name}`);
    } catch (err) {
      db.exec("ROLLBACK");
      const detail = err instanceof Error ? err.message : String(err);
      // Be precise: this migration rolled back, but earlier ones in this run
      // are already committed — the DB is at `applied`, not at its start state.
      const at = applied.length
        ? `applied and kept: ${applied.map((m) => m.id).join(", ")}`
        : "no migrations were applied";
      throw new Error(
        `migration ${migration.id}_${migration.name} failed: ${detail}\n` +
          `  rolled back this migration; ${at}` +
          (backupPath ? `\n  pre-migration backup: ${backupPath}` : ""),
      );
    }
  }

  return { applied, backupPath };
}
