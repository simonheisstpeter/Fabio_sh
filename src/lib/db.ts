import Database from 'better-sqlite3';
import { join } from 'path';
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

// ── CV constants (shared across API routes) ────────────────────────────────

export const CV_COOKIE = 'cv_secret';
export const CV_LANGS = ['de', 'en'] as const;
export type CvLang = (typeof CV_LANGS)[number];

// ── DB singleton ───────────────────────────────────────────────────────────

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), 'db/fabio.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(dbPath);

  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.pragma('synchronous = NORMAL');   // safe with WAL; better write throughput
  _db.pragma('cache_size = -4000');     // 4 MB page cache
  _db.pragma('temp_store = memory');    // temp tables/indices in RAM
  _db.pragma('mmap_size = 67108864');   // 64 MB memory-mapped reads
  _db.pragma('busy_timeout = 5000');    // wait up to 5 s before SQLITE_BUSY

  initSchema(_db);
  migrateCvFiles(_db);
  return _db;
}

// ── Schema ─────────────────────────────────────────────────────────────────

function migrateCvFiles(db: Database.Database) {
  const cols = db.prepare('PRAGMA table_info(cv_files)').all() as { name: string }[];
  if (cols.length > 0 && !cols.some((c) => c.name === 'lang')) {
    db.exec('DROP TABLE cv_files');
    db.exec(`CREATE TABLE cv_files (
      lang        TEXT PRIMARY KEY CHECK (lang IN ('de', 'en')),
      data        BLOB NOT NULL,
      filename    TEXT NOT NULL,
      size        INTEGER NOT NULL,
      uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  }
}

function initSchema(db: Database.Database) {
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

    CREATE INDEX IF NOT EXISTS idx_projects_pub_fin ON projects(published, finished);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires  ON admin_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_submissions_at    ON contact_submissions(submitted_at DESC);
  `);
}

// ── Project types & helpers ────────────────────────────────────────────────

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

let _projectsCache: { data: Project[]; expiresAt: number } | null = null;
const PROJECTS_CACHE_TTL = 60_000;

export function getAllProjects(): Project[] {
  const now = Date.now();
  if (_projectsCache && _projectsCache.expiresAt > now) return _projectsCache.data;
  const rows = getDb().prepare('SELECT * FROM projects').all() as ProjectRow[];
  const data = rows.map(rowToProject);
  _projectsCache = { data, expiresAt: now + PROJECTS_CACHE_TTL };
  return data;
}

export function invalidateProjectsCache(): void {
  _projectsCache = null;
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
  return (getDb()
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

// ── CV types ───────────────────────────────────────────────────────────────

export type CvFileRow = {
  lang: CvLang;
  filename: string;
  size: number;
  uploaded_at: string;
};

export type CvSecretRow = {
  id: number;
  label: string;
  secret: string;
  view_count: number;
  last_opened_at: string | null;
  created_at: string;
};

// ── CV file helpers ────────────────────────────────────────────────────────

export function getCvFile(lang: CvLang): CvFileRow | null {
  return getDb()
    .prepare('SELECT lang, filename, size, uploaded_at FROM cv_files WHERE lang = ?')
    .get(lang) as CvFileRow | null;
}

export function getCvFiles(): Record<CvLang, CvFileRow | null> {
  const rows = getDb()
    .prepare('SELECT lang, filename, size, uploaded_at FROM cv_files')
    .all() as CvFileRow[];
  const map: Record<CvLang, CvFileRow | null> = { de: null, en: null };
  for (const row of rows) map[row.lang] = row;
  return map;
}

// PDF blobs are large — cache in process memory; invalidated on upload.
const _cvDataCache = new Map<CvLang, Buffer>();

export function getCvFileData(lang: CvLang): Buffer | null {
  const cached = _cvDataCache.get(lang);
  if (cached) return cached;
  const row = getDb()
    .prepare('SELECT data FROM cv_files WHERE lang = ?')
    .get(lang) as { data: Buffer } | null;
  if (row) {
    _cvDataCache.set(lang, row.data);
    return row.data;
  }
  return null;
}

export function invalidateCvCache(lang?: CvLang): void {
  if (lang) _cvDataCache.delete(lang);
  else _cvDataCache.clear();
}

// ── CV secret helpers ──────────────────────────────────────────────────────

// Cache secret lookups to avoid a DB read on every /api/cv/file request.
// TTL is short so deleted secrets stop working within 30 s.
const _secretCache = new Map<string, { row: CvSecretRow; expiresAt: number }>();
const SECRET_CACHE_TTL = 30_000;

export function getCvSecretByValue(secret: string): CvSecretRow | null {
  const cached = _secretCache.get(secret);
  if (cached && cached.expiresAt > Date.now()) return cached.row;
  const row = getDb()
    .prepare('SELECT id, label, secret, view_count, last_opened_at, created_at FROM cv_secrets WHERE secret = ?')
    .get(secret) as CvSecretRow | null;
  if (row) _secretCache.set(secret, { row, expiresAt: Date.now() + SECRET_CACHE_TTL });
  else _secretCache.delete(secret);
  return row;
}

export function invalidateCvSecretCache(secret?: string): void {
  if (secret) _secretCache.delete(secret);
  else _secretCache.clear();
}

export function getCvSecrets(): CvSecretRow[] {
  return getDb()
    .prepare('SELECT id, label, secret, view_count, last_opened_at, created_at FROM cv_secrets ORDER BY created_at DESC')
    .all() as CvSecretRow[];
}

export function recordCvAccess(secretId: number): void {
  getDb()
    .prepare('UPDATE cv_secrets SET view_count = view_count + 1, last_opened_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(secretId);
}
