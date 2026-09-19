/**
 * Versioned schema migrations.
 *
 * Plain JS (like i18n/locales.js) so both `db.ts` — which bundles into dist/ and
 * therefore reaches production — and the standalone `migrate.js` CLI can import
 * the exact same list. Production only ships dist/ plus a few named .js files,
 * so anything that must run there has to arrive by one of those two routes.
 *
 * Rules for adding a migration:
 *   1. Append; never renumber or edit an applied migration.
 *   2. Make it idempotent. Existing databases predate this runner, so every
 *      migration must be safe to run against a DB where it is already true.
 *   3. Keep it synchronous — node:sqlite is sync and each runs in a transaction.
 */

/** @typedef {import("node:sqlite").DatabaseSync} DatabaseSync */
/** @typedef {{ id: number, name: string, up: (db: DatabaseSync) => void }} Migration */

/** @param {DatabaseSync} db @param {string} table */
function columns(db, table) {
  return /** @type {{name: string}[]} */ (db.prepare(`PRAGMA table_info(${table})`).all()).map(
    (c) => c.name,
  );
}

/** @param {DatabaseSync} db @param {string} table */
function tableExists(db, table) {
  return (
    db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table) !== undefined
  );
}

/** Locales that existed as `desc_*` columns before normalisation. */
const LEGACY_DESC_LOCALES = ["de", "en", "es", "it", "ja", "pt"];

/** @type {Migration[]} */
export const MIGRATIONS = [
  {
    id: 1,
    name: "initial_schema",
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          id            TEXT PRIMARY KEY,
          title         TEXT NOT NULL,
          desc_de       TEXT NOT NULL DEFAULT '',
          desc_en       TEXT NOT NULL DEFAULT '',
          desc_es       TEXT NOT NULL DEFAULT '',
          desc_it       TEXT NOT NULL DEFAULT '',
          desc_ja       TEXT NOT NULL DEFAULT '',
          desc_pt       TEXT NOT NULL DEFAULT '',
          categories    TEXT NOT NULL DEFAULT '[]',
          published     INTEGER NOT NULL DEFAULT 0,
          finished      INTEGER NOT NULL DEFAULT 0,
          online        INTEGER NOT NULL DEFAULT 0,
          image         TEXT NOT NULL DEFAULT '',
          url           TEXT NOT NULL DEFAULT '',
          languages     TEXT NOT NULL DEFAULT '[]'
        );

        CREATE TABLE IF NOT EXISTS contact_submissions (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          name          TEXT NOT NULL,
          email         TEXT NOT NULL,
          message       TEXT NOT NULL,
          ip_hash       TEXT NOT NULL DEFAULT '',
          submitted_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS rate_limits (
          ip_hash       TEXT PRIMARY KEY,
          count         INTEGER NOT NULL DEFAULT 1,
          window_start  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS webauthn_credentials (
          credential_id  TEXT PRIMARY KEY,
          public_key     TEXT NOT NULL,
          counter        INTEGER NOT NULL DEFAULT 0,
          device_type    TEXT,
          backed_up      INTEGER NOT NULL DEFAULT 0,
          transports     TEXT,
          created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_password (
          id      INTEGER PRIMARY KEY CHECK (id = 1),
          email   TEXT NOT NULL,
          hash    TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS admin_sessions (
          token       TEXT PRIMARY KEY,
          expires_at  DATETIME NOT NULL,
          created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS login_attempts (
          ip_hash      TEXT PRIMARY KEY,
          count        INTEGER NOT NULL DEFAULT 1,
          window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cv_files (
          lang        TEXT PRIMARY KEY CHECK (lang IN ('de', 'en')),
          data        BLOB NOT NULL,
          filename    TEXT NOT NULL,
          size        INTEGER NOT NULL,
          uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cv_secrets (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          label          TEXT NOT NULL,
          secret         TEXT UNIQUE NOT NULL,
          view_count     INTEGER NOT NULL DEFAULT 0,
          last_opened_at DATETIME,
          created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS courses (
          id               TEXT PRIMARY KEY,
          title            TEXT NOT NULL,
          platform         TEXT NOT NULL DEFAULT '',
          status           TEXT NOT NULL DEFAULT 'not_started'
                           CHECK (status IN ('not_started','in_progress','completed')),
          progress         INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
          topics           TEXT NOT NULL DEFAULT '[]',
          url              TEXT NOT NULL DEFAULT '',
          start_date       TEXT NOT NULL DEFAULT '',
          end_date         TEXT NOT NULL DEFAULT '',
          certificate      BLOB,
          certificate_name TEXT NOT NULL DEFAULT '',
          notes            TEXT NOT NULL DEFAULT '',
          published        INTEGER NOT NULL DEFAULT 0,
          sort_order       INTEGER NOT NULL DEFAULT 0,
          created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
        );

        CREATE INDEX IF NOT EXISTS idx_projects_pub_fin  ON projects(published, finished);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires  ON admin_sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_submissions_at    ON contact_submissions(submitted_at DESC);
        CREATE INDEX IF NOT EXISTS idx_courses_pub_sort  ON courses(published, sort_order, created_at);
        CREATE INDEX IF NOT EXISTS idx_courses_status    ON courses(status);
        CREATE INDEX IF NOT EXISTS idx_courses_platform  ON courses(platform);
      `);
    },
  },

  {
    id: 2,
    name: "cv_files_add_lang_column",
    up(db) {
      // Pre-dates the per-language CV. The old table had no `lang`, and held no
      // data worth keeping, so it is rebuilt rather than migrated.
      if (!tableExists(db, "cv_files")) return;
      if (columns(db, "cv_files").includes("lang")) return;

      db.exec("DROP TABLE cv_files");
      db.exec(`CREATE TABLE cv_files (
        lang        TEXT PRIMARY KEY CHECK (lang IN ('de', 'en')),
        data        BLOB NOT NULL,
        filename    TEXT NOT NULL,
        size        INTEGER NOT NULL,
        uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);
    },
  },

  {
    id: 3,
    name: "normalize_project_relations",
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS project_translations (
          project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          locale      TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          PRIMARY KEY (project_id, locale)
        );

        CREATE TABLE IF NOT EXISTS project_categories (
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          category   TEXT NOT NULL,
          PRIMARY KEY (project_id, category)
        );

        CREATE INDEX IF NOT EXISTS idx_project_categories_cat ON project_categories(category);
      `);

      // Already normalised (e.g. a DB migrated before this runner existed).
      if (!columns(db, "projects").includes("desc_de")) return;

      const selectCols = ["id", "categories", ...LEGACY_DESC_LOCALES.map((l) => `desc_${l}`)].join(
        ", ",
      );
      const rows = /** @type {Record<string, string>[]} */ (
        db.prepare(`SELECT ${selectCols} FROM projects`).all()
      );

      const insertTranslation = db.prepare(
        "INSERT OR REPLACE INTO project_translations (project_id, locale, description) VALUES (?, ?, ?)",
      );
      const insertCategory = db.prepare(
        "INSERT OR IGNORE INTO project_categories (project_id, category) VALUES (?, ?)",
      );

      for (const row of rows) {
        for (const locale of LEGACY_DESC_LOCALES) {
          const description = row[`desc_${locale}`] ?? "";
          if (description.trim()) insertTranslation.run(row.id, locale, description);
        }

        let categories;
        try {
          categories = JSON.parse(row.categories || "[]");
        } catch {
          throw new Error(`project "${row.id}" has unparseable categories JSON`);
        }
        if (!Array.isArray(categories)) {
          throw new Error(`project "${row.id}" categories is not an array`);
        }
        for (const category of categories) {
          if (typeof category === "string" && category.trim()) {
            insertCategory.run(row.id, category.trim());
          }
        }
      }

      for (const locale of LEGACY_DESC_LOCALES) {
        db.exec(`ALTER TABLE projects DROP COLUMN desc_${locale}`);
      }
      db.exec("ALTER TABLE projects DROP COLUMN categories");
    },
  },

  {
    id: 4,
    name: "projects_add_created_at",
    up(db) {
      if (columns(db, "projects").includes("created_at")) return;

      // node:sqlite rejects ALTER TABLE ADD COLUMN with any non-constant
      // DEFAULT — including CURRENT_TIMESTAMP — so the column is added bare
      // (nullable) and backfilled explicitly. Existing rows have no real
      // creation date; rather than inventing false precision (e.g. staggered
      // synthetic dates), every pre-existing project gets the migration's run
      // time — "recently added" sort is a real signal for anything created
      // from here on, and a stable no-op tiebreak for the historical batch.
      db.exec("ALTER TABLE projects ADD COLUMN created_at TEXT");
      db.prepare("UPDATE projects SET created_at = ? WHERE created_at IS NULL").run(
        new Date().toISOString(),
      );
    },
  },

  {
    id: 5,
    name: "auth_hardening",
    up(db) {
      db.exec(`
        -- WebAuthn challenges live server-side and are single-use. They used to
        -- sit in a client-controlled cookie, which made captured assertions
        -- replayable.
        CREATE TABLE IF NOT EXISTS auth_challenges (
          id         TEXT PRIMARY KEY,
          challenge  TEXT NOT NULL,
          purpose    TEXT NOT NULL CHECK (purpose IN ('register', 'login')),
          expires_at DATETIME NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_auth_challenges_expires ON auth_challenges(expires_at);

        -- Password-login throttling now shares rate_limits (atomic UPSERT).
        DROP TABLE IF EXISTS login_attempts;

        -- Tables are tiny and every list query reads them whole, so these
        -- indexes were never used.
        DROP INDEX IF EXISTS idx_courses_status;
        DROP INDEX IF EXISTS idx_courses_platform;
        DROP INDEX IF EXISTS idx_projects_pub_fin;
      `);

      // Session tokens are now stored as SHA-256 digests, so a leaked DB backup
      // no longer contains live sessions. Existing plaintext rows can't be
      // converted (SQLite has no SHA-256), so everyone signs in once more.
      db.exec("DELETE FROM admin_sessions");
    },
  },
];
