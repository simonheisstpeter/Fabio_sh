import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { MIGRATIONS } from "../../src/lib/migrations.js";
import { runMigrations } from "../../src/lib/migrate-runner.js";

function open() {
  const dir = mkdtempSync(join(tmpdir(), "fabio-mig-"));
  const dbPath = join(dir, "m.db");
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  return { dir, dbPath, db };
}

const tables = (db: DatabaseSync) =>
  (
    db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]
  ).map((r) => r.name);

const columns = (db: DatabaseSync, table: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);

describe("migrations", () => {
  it("builds the full current schema on an empty database", () => {
    const { db } = open();
    const { applied } = runMigrations(db, { backup: false });

    expect(applied.map((m: { id: number }) => m.id)).toEqual(MIGRATIONS.map((m) => m.id));
    const t = tables(db);
    expect(t).toEqual(
      expect.arrayContaining([
        "projects",
        "project_translations",
        "project_categories",
        "courses",
        "cv_files",
        "cv_secrets",
        "contact_submissions",
        "rate_limits",
        "webauthn_credentials",
        "admin_password",
        "admin_sessions",
        "auth_challenges",
        "schema_migrations",
      ]),
    );
    // Retired by migration 5.
    expect(t).not.toContain("login_attempts");
    // Normalised by migration 3/4.
    expect(columns(db, "projects")).not.toContain("desc_de");
    expect(columns(db, "projects")).toContain("created_at");
  });

  it("is idempotent — a second run applies nothing", () => {
    const { db } = open();
    runMigrations(db, { backup: false });
    const again = runMigrations(db, { backup: false });
    expect(again.applied).toEqual([]);
    expect(again.backupPath).toBeNull();
  });

  it("drops the indexes that were never used", () => {
    const { db } = open();
    runMigrations(db, { backup: false });
    const idx = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as { name: string }[]
    ).map((r) => r.name);
    expect(idx).not.toContain("idx_courses_status");
    expect(idx).not.toContain("idx_courses_platform");
    expect(idx).not.toContain("idx_projects_pub_fin");
    expect(idx).toContain("idx_auth_challenges_expires");
  });

  it("enforces the CHECK constraints the app relies on", () => {
    const { db } = open();
    runMigrations(db, { backup: false });
    expect(() =>
      db.prepare("INSERT INTO courses (id, title, status) VALUES ('a','t','bogus')").run(),
    ).toThrow(/CHECK/i);
    expect(() =>
      db
        .prepare("INSERT INTO auth_challenges (id, challenge, purpose, expires_at) VALUES ('i','c','nope','2999-01-01')")
        .run(),
    ).toThrow(/CHECK/i);
  });

  it("cascades project children on delete (foreign keys on)", () => {
    const { db } = open();
    runMigrations(db, { backup: false });
    db.prepare("INSERT INTO projects (id, title) VALUES ('p','P')").run();
    db.prepare("INSERT INTO project_translations (project_id, locale, description) VALUES ('p','de','x')").run();
    db.prepare("INSERT INTO project_categories (project_id, category) VALUES ('p','Web')").run();
    db.prepare("DELETE FROM projects WHERE id='p'").run();
    expect(db.prepare("SELECT COUNT(*) n FROM project_translations").get()).toEqual({ n: 0 });
    expect(db.prepare("SELECT COUNT(*) n FROM project_categories").get()).toEqual({ n: 0 });
  });

  it("migration 5 signs everyone out (sessions are now hashed)", () => {
    const { db } = open();
    runMigrations(db, { backup: false });
    db.prepare("INSERT INTO admin_sessions (token, expires_at) VALUES ('plain','2999-01-01')").run();

    // Re-arm migration 5 as pending and run it again.
    db.prepare("DELETE FROM schema_migrations WHERE id = 5").run();
    runMigrations(db, { backup: false });

    expect(db.prepare("SELECT COUNT(*) n FROM admin_sessions").get()).toEqual({ n: 0 });
  });

  it("snapshots before migrating and keeps only the newest five snapshots", () => {
    const { dir, dbPath, db } = open();
    runMigrations(db, { backup: false });
    db.prepare("INSERT INTO projects (id, title) VALUES ('keep','me')").run();

    const backups = join(dir, "backups");
    mkdirSync(backups);
    for (let day = 1; day <= 7; day++) {
      writeFileSync(join(backups, `pre-migration-2020-01-0${day}T00-00-00-000Z.db`), "old");
    }
    // Unrelated files must never be pruned.
    writeFileSync(join(backups, "notes.txt"), "keep");

    db.prepare("DELETE FROM schema_migrations WHERE id = 5").run();
    const { backupPath } = runMigrations(db, { dbPath, backup: true });

    expect(backupPath).not.toBeNull();
    expect(existsSync(backupPath!)).toBe(true);

    const files = readdirSync(backups);
    const snapshots = files.filter((f) => f.startsWith("pre-migration-"));
    expect(snapshots).toHaveLength(5);
    for (const gone of [1, 2, 3]) {
      expect(files).not.toContain(`pre-migration-2020-01-0${gone}T00-00-00-000Z.db`);
    }
    expect(files).toContain("notes.txt");

    // The snapshot really contains the data as it was.
    const snap = new DatabaseSync(backupPath!);
    expect(snap.prepare("SELECT title FROM projects WHERE id='keep'").get()).toEqual({ title: "me" });
  });

  it("does not snapshot a brand-new database", () => {
    const { dir, dbPath, db } = open();
    const { backupPath } = runMigrations(db, { dbPath, backup: true });
    expect(backupPath).toBeNull();
    expect(existsSync(join(dir, "backups"))).toBe(false);
  });

  describe("failure handling", () => {
    afterEach(() => {
      const i = MIGRATIONS.findIndex((m) => m.id === 99);
      if (i !== -1) MIGRATIONS.splice(i, 1);
    });

    it("rolls a failing migration back completely and reports what stayed applied", () => {
      const { db } = open();
      runMigrations(db, { backup: false });

      MIGRATIONS.push({
        id: 99,
        name: "boom",
        up(d) {
          d.exec("CREATE TABLE half_done (x)");
          throw new Error("kaboom");
        },
      });

      expect(() => runMigrations(db, { backup: false })).toThrow(/99_boom failed: kaboom/);
      expect(tables(db)).not.toContain("half_done");
      const ids = (db.prepare("SELECT id FROM schema_migrations").all() as { id: number }[]).map((r) => r.id);
      expect(ids).not.toContain(99);
      expect(ids).toContain(5);
    });
  });
});
