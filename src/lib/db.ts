import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';

export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET ?? 'changeme';
  return createHash('sha256').update(secret + ip).digest('hex');
}

export function parseLanguages(raw: string): { flag: string; lang: string }[] {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(' ');
      if (firstSpace === -1) return { flag: '', lang: line };
      return { flag: line.slice(0, firstSpace), lang: line.slice(firstSpace + 1).trim() };
    });
}

const dbPath =
  process.env.DATABASE_PATH ??
  join(process.cwd(), 'db/fabio.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(dbPath);

  // WAL mode for better concurrent read performance
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL,
      desc_de       TEXT DEFAULT '',
      desc_en       TEXT DEFAULT '',
      desc_es       TEXT DEFAULT '',
      desc_it       TEXT DEFAULT '',
      desc_ja       TEXT DEFAULT '',
      desc_pt       TEXT DEFAULT '',
      categories    TEXT NOT NULL DEFAULT '[]',
      published     INTEGER NOT NULL DEFAULT 0,
      finished      INTEGER NOT NULL DEFAULT 0,
      online        INTEGER NOT NULL DEFAULT 0,
      image         TEXT DEFAULT '',
      url           TEXT DEFAULT '',
      languages     TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS contact_submissions (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      message       TEXT NOT NULL,
      ip_hash       TEXT,
      submitted_at  DATETIME DEFAULT CURRENT_TIMESTAMP
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
      backed_up      INTEGER DEFAULT 0,
      transports     TEXT,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_password (
      id      INTEGER PRIMARY KEY CHECK (id = 1),
      email   TEXT NOT NULL,
      hash    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token       TEXT PRIMARY KEY,
      expires_at  DATETIME NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      ip_hash      TEXT PRIMARY KEY,
      count        INTEGER NOT NULL DEFAULT 1,
      window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_projects_pub_fin ON projects(published, finished);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);
  `);
}

export type ProjectRow = {
  id: string;
  title: string;
  desc_de: string;
  desc_en: string;
  desc_es: string;
  desc_it: string;
  desc_ja: string;
  desc_pt: string;
  categories: string;
  published: number;
  finished: number;
  online: number;
  image: string;
  url: string;
  languages: string;
};

export type Project = {
  id: string;
  title: string;
  description: Record<string, string>;
  categories: string[];
  published: boolean;
  finished: boolean;
  online: boolean;
  image: string;
  url: string;
  languages: { lang: string; flag: string }[];
};

export function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: {
      de: row.desc_de,
      en: row.desc_en,
      es: row.desc_es,
      it: row.desc_it,
      ja: row.desc_ja,
      pt: row.desc_pt,
    },
    categories: JSON.parse(row.categories),
    published: Boolean(row.published),
    finished: Boolean(row.finished),
    online: Boolean(row.online),
    image: row.image,
    url: row.url,
    languages: JSON.parse(row.languages),
  };
}

export function getAllProjects(): Project[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM projects').all() as ProjectRow[];
  return rows.map(rowToProject);
}

export type ProjectListItem = {
  id: string;
  title: string;
  published: boolean;
  finished: boolean;
  online: boolean;
};

type ProjectListRow = { id: string; title: string; published: number; finished: number; online: number };

export function getProjectsList(): ProjectListItem[] {
  const db = getDb();
  return (db
    .prepare('SELECT id, title, published, finished, online FROM projects ORDER BY id')
    .all() as ProjectListRow[]
  ).map((r) => ({
    id: r.id,
    title: r.title,
    published: Boolean(r.published),
    finished: Boolean(r.finished),
    online: Boolean(r.online),
  }));
}
