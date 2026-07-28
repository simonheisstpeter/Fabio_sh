import { DatabaseSync } from "node:sqlite";
import { join } from "path";
import { createHash } from "node:crypto";
import { runMigrations } from "./migrate-runner.js";

export function hashIp(ip: string): string {
  const secret = process.env.IP_HASH_SECRET ?? "changeme";
  return createHash("sha256")
    .update(secret + ip)
    .digest("hex");
}

export function parseLanguages(raw: string): { flag: string; lang: string }[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const firstSpace = line.indexOf(" ");
      if (firstSpace === -1) return { flag: "", lang: line };
      return {
        flag: line.slice(0, firstSpace),
        lang: line.slice(firstSpace + 1).trim(),
      };
    });
}

// ── CV constants (shared across API routes) ────────────────────────────────

export const CV_COOKIE = "cv_secret";
export const CV_LANGS = ["de", "en"] as const;
export type CvLang = (typeof CV_LANGS)[number];

// ── DB singleton ───────────────────────────────────────────────────────────

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "db/fabio.db");

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (_db) return _db;

  _db = new DatabaseSync(dbPath);

  _db.exec("PRAGMA journal_mode = WAL");
  _db.exec("PRAGMA foreign_keys = ON");
  _db.exec("PRAGMA synchronous = NORMAL"); // safe with WAL; better write throughput
  _db.exec("PRAGMA cache_size = -4000"); // 4 MB page cache
  _db.exec("PRAGMA temp_store = memory"); // temp tables/indices in RAM
  _db.exec("PRAGMA mmap_size = 67108864"); // 64 MB memory-mapped reads
  _db.exec("PRAGMA busy_timeout = 5000"); // wait up to 5 s before SQLITE_BUSY

  // Schema is owned entirely by the versioned migration runner. It records what
  // it applies in `schema_migrations`, snapshots the DB first, and is a no-op
  // once up to date — so booting a fresh container migrates prod automatically.
  runMigrations(_db, { dbPath, log: (msg) => console.log(msg) });

  return _db;
}

// ── Schema ─────────────────────────────────────────────────────────────────
// Table definitions and all schema changes live in `migrations.js`, applied by
// `migrate-runner.js`. Nothing here creates or alters tables.

// ── Project types & helpers ────────────────────────────────────────────────

export type ProjectRow = {
  id: string;
  title: string;
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

export function rowToProject(
  row: ProjectRow,
  description: Record<string, string> = {},
  categories: string[] = [],
): Project {
  return {
    id: row.id,
    title: row.title,
    description,
    categories,
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

/**
 * Three queries — projects, all translations, all categories — stitched in
 * memory. Deliberately not a per-project lookup: that would be N+1.
 */
export function getAllProjects(): Project[] {
  const now = Date.now();
  if (_projectsCache && _projectsCache.expiresAt > now) return _projectsCache.data;

  const db = getDb();
  const rows = db.prepare("SELECT * FROM projects").all() as ProjectRow[];

  const descriptions = new Map<string, Record<string, string>>();
  for (const t of db
    .prepare("SELECT project_id, locale, description FROM project_translations")
    .all() as { project_id: string; locale: string; description: string }[]) {
    (descriptions.get(t.project_id) ?? descriptions.set(t.project_id, {}).get(t.project_id)!)[
      t.locale
    ] = t.description;
  }

  const categories = new Map<string, string[]>();
  for (const c of db
    .prepare("SELECT project_id, category FROM project_categories ORDER BY category")
    .all() as { project_id: string; category: string }[]) {
    (categories.get(c.project_id) ?? categories.set(c.project_id, []).get(c.project_id)!).push(
      c.category,
    );
  }

  const data = rows.map((r) =>
    rowToProject(r, descriptions.get(r.id) ?? {}, categories.get(r.id) ?? []),
  );
  _projectsCache = { data, expiresAt: now + PROJECTS_CACHE_TTL };
  return data;
}

/** Single project with its relations — for the admin edit page. */
export function getProject(id: string): Project | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as
    | ProjectRow
    | undefined;
  if (!row) return null;

  const description: Record<string, string> = {};
  for (const t of db
    .prepare("SELECT locale, description FROM project_translations WHERE project_id = ?")
    .all(id) as { locale: string; description: string }[]) {
    description[t.locale] = t.description;
  }

  const categories = (
    db
      .prepare("SELECT category FROM project_categories WHERE project_id = ? ORDER BY category")
      .all(id) as { category: string }[]
  ).map((c) => c.category);

  return rowToProject(row, description, categories);
}

export function invalidateProjectsCache(): void {
  _projectsCache = null;
}

export type ProjectInput = {
  id: string;
  title: string;
  /** Any locale key; empty values are not stored. */
  description: Record<string, string>;
  categories: string[];
  published: boolean;
  finished: boolean;
  online: boolean;
  image: string;
  url: string;
  languages: { lang: string; flag: string }[];
};

/**
 * Writes a project and its relations as one unit — shared by create and update
 * so the column list lives in exactly one place. Child rows are replaced
 * wholesale, which is simplest and correct for the handful of rows involved.
 */
export function saveProject(input: ProjectInput, mode: "insert" | "update"): void {
  const db = getDb();

  db.exec("BEGIN IMMEDIATE");
  try {
    if (mode === "insert") {
      db.prepare(
        `INSERT INTO projects (id, title, published, finished, online, image, url, languages)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        input.id,
        input.title,
        input.published ? 1 : 0,
        input.finished ? 1 : 0,
        input.online ? 1 : 0,
        input.image,
        input.url,
        JSON.stringify(input.languages),
      );
    } else {
      const info = db
        .prepare(
          `UPDATE projects SET title = ?, published = ?, finished = ?, online = ?,
                               image = ?, url = ?, languages = ?
           WHERE id = ?`,
        )
        .run(
          input.title,
          input.published ? 1 : 0,
          input.finished ? 1 : 0,
          input.online ? 1 : 0,
          input.image,
          input.url,
          JSON.stringify(input.languages),
          input.id,
        );
      if (info.changes === 0) throw new NotFoundError(`Project "${input.id}" not found`);
    }

    db.prepare("DELETE FROM project_translations WHERE project_id = ?").run(input.id);
    const insertTranslation = db.prepare(
      "INSERT INTO project_translations (project_id, locale, description) VALUES (?, ?, ?)",
    );
    for (const [locale, description] of Object.entries(input.description)) {
      if (description.trim()) insertTranslation.run(input.id, locale, description);
    }

    db.prepare("DELETE FROM project_categories WHERE project_id = ?").run(input.id);
    const insertCategory = db.prepare(
      "INSERT OR IGNORE INTO project_categories (project_id, category) VALUES (?, ?)",
    );
    for (const category of input.categories) {
      if (category.trim()) insertCategory.run(input.id, category.trim());
    }

    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  invalidateProjectsCache();
}

export class NotFoundError extends Error {}

export function deleteProject(id: string): void {
  // project_translations / project_categories cascade via FK.
  getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  invalidateProjectsCache();
}

export type ProjectListItem = {
  id: string;
  title: string;
  published: boolean;
  finished: boolean;
  online: boolean;
};

type ProjectListRow = {
  id: string;
  title: string;
  published: number;
  finished: number;
  online: number;
};

export function getProjectsList(): ProjectListItem[] {
  return (
    getDb()
      .prepare(
        "SELECT id, title, published, finished, online FROM projects ORDER BY id",
      )
      .all() as ProjectListRow[]
  ).map((r) => ({
    id: r.id,
    title: r.title,
    published: Boolean(r.published),
    finished: Boolean(r.finished),
    online: Boolean(r.online),
  }));
}

// ── Course types & helpers ─────────────────────────────────────────────────

type CourseStatus = "not_started" | "in_progress" | "completed";

export type CourseRow = {
  id: string;
  title: string;
  platform: string;
  status: string;
  progress: number;
  topics: string;
  url: string;
  start_date: string;
  end_date: string;
  certificate: Uint8Array | null;
  certificate_name: string;
  notes: string;
  published: number;
  sort_order: number;
  created_at: string;
};

/**
 * Same as CourseRow but with the certificate BLOB replaced by a flag.
 * Certificates can be 10 MB each, so list queries must never select the blob —
 * they only ever need to know whether one exists.
 */
type CourseListRow = Omit<CourseRow, "certificate"> & { has_certificate: number };

const COURSE_LIST_COLUMNS = `
  id, title, platform, status, progress, topics, url, start_date, end_date,
  certificate IS NOT NULL AS has_certificate, certificate_name, notes,
  published, sort_order, created_at
`;

export type Course = {
  id: string;
  title: string;
  platform: string;
  status: CourseStatus;
  progress: number;
  topics: string[];
  url: string;
  startDate: string;
  endDate: string;
  hasCertificate: boolean;
  certificateName: string;
  notes: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
};

function rowToCourse(row: CourseListRow): Course {
  return {
    id: row.id,
    title: row.title,
    platform: row.platform,
    status: row.status as CourseStatus,
    progress: row.progress,
    topics: JSON.parse(row.topics),
    url: row.url,
    startDate: row.start_date,
    endDate: row.end_date,
    hasCertificate: Boolean(row.has_certificate),
    certificateName: row.certificate_name,
    notes: row.notes,
    published: Boolean(row.published),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

let _coursesCache: { data: Course[]; expiresAt: number } | null = null;
const COURSES_CACHE_TTL = 60_000;

export function getAllCourses(): Course[] {
  const now = Date.now();
  if (_coursesCache && _coursesCache.expiresAt > now) return _coursesCache.data;
  const rows = getDb()
    .prepare(`SELECT ${COURSE_LIST_COLUMNS} FROM courses ORDER BY sort_order, created_at`)
    .all() as CourseListRow[];
  const data = rows.map(rowToCourse);
  _coursesCache = { data, expiresAt: now + COURSES_CACHE_TTL };
  return data;
}

export function invalidateCoursesCache(): void {
  _coursesCache = null;
}

export function getCourse(id: string): Course | null {
  const row = getDb()
    .prepare(`SELECT ${COURSE_LIST_COLUMNS} FROM courses WHERE id = ?`)
    .get(id) as CourseListRow | undefined;
  return row ? rowToCourse(row) : null;
}

// function getCourseRaw(id: string): CourseRow | null {
//   return (
//     (getDb().prepare("SELECT * FROM courses WHERE id = ?").get(id) as CourseRow | undefined) ?? null
//   );
// }

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
    .prepare(
      "SELECT lang, filename, size, uploaded_at FROM cv_files WHERE lang = ?",
    )
    .get(lang) as CvFileRow | null;
}

export function getCvFiles(): Record<CvLang, CvFileRow | null> {
  const rows = getDb()
    .prepare("SELECT lang, filename, size, uploaded_at FROM cv_files")
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
    .prepare("SELECT data FROM cv_files WHERE lang = ?")
    .get(lang) as {
    data: Buffer;
  } | null;
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
    .prepare(
      "SELECT id, label, secret, view_count, last_opened_at, created_at FROM cv_secrets WHERE secret = ?",
    )
    .get(secret) as CvSecretRow | null;
  if (row)
    _secretCache.set(secret, { row, expiresAt: Date.now() + SECRET_CACHE_TTL });
  else _secretCache.delete(secret);
  return row;
}

export function invalidateCvSecretCache(secret?: string): void {
  if (secret) _secretCache.delete(secret);
  else _secretCache.clear();
}

export function getCvSecrets(): CvSecretRow[] {
  return getDb()
    .prepare(
      "SELECT id, label, secret, view_count, last_opened_at, created_at FROM cv_secrets ORDER BY created_at DESC",
    )
    .all() as CvSecretRow[];
}

export function recordCvAccess(secretId: number): void {
  getDb()
    .prepare(
      "UPDATE cv_secrets SET view_count = view_count + 1, last_opened_at = CURRENT_TIMESTAMP WHERE id = ?",
    )
    .run(secretId);
}
