import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it, vi } from "vitest";
import { freshEnv } from "../helpers/unit";
import type { ProjectInput } from "../../src/lib/db";

async function setup() {
  const env = freshEnv({ IP_HASH_SECRET: "s" });
  const lib = await env.db();
  return { lib, db: lib.getDb() };
}

const project = (over: Partial<ProjectInput> = {}): ProjectInput => ({
  id: "p1",
  title: "Project One",
  description: { de: "Hallo", en: "Hello" },
  categories: ["Web", "AI"],
  published: true,
  finished: false,
  online: true,
  image: "/i.png",
  url: "https://example.com",
  languages: [{ flag: "🇩🇪", lang: "German" }],
  ...over,
});

const count = (db: DatabaseSync, table: string) =>
  (db.prepare(`SELECT COUNT(*) n FROM ${table}`).get() as { n: number }).n;

describe("connection", () => {
  it("enables foreign keys, WAL and a busy timeout, and migrates on first use", async () => {
    const { db } = await setup();
    expect(db.prepare("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
    expect(db.prepare("PRAGMA journal_mode").get()).toEqual({ journal_mode: "wal" });
    expect(db.prepare("PRAGMA busy_timeout").get()).toEqual({ timeout: 5000 });
    expect(db.prepare("SELECT MAX(id) m FROM schema_migrations").get()).toEqual({ m: 5 });
  });

  it("is a singleton", async () => {
    const { lib } = await setup();
    expect(lib.getDb()).toBe(lib.getDb());
  });
});

describe("saveProject", () => {
  it("inserts the project with its translations and categories, stamping created_at", async () => {
    const { lib } = await setup();
    lib.saveProject(project(), "insert");

    const p = lib.getProject("p1")!;
    expect(p).toMatchObject({
      id: "p1",
      title: "Project One",
      published: true,
      finished: false,
      online: true,
      description: { de: "Hallo", en: "Hello" },
      categories: ["AI", "Web"], // ORDER BY category
      languages: [{ flag: "🇩🇪", lang: "German" }],
    });
    expect(Date.parse(p.createdAt)).not.toBeNaN();
  });

  it("skips blank descriptions and de-duplicates categories", async () => {
    const { lib } = await setup();
    lib.saveProject(
      project({ description: { de: "x", en: "   " }, categories: ["Web", "Web", "  Web  ", ""] }),
      "insert",
    );
    const p = lib.getProject("p1")!;
    expect(p.description).toEqual({ de: "x" });
    expect(p.categories).toEqual(["Web"]);
  });

  it("update replaces children wholesale and keeps created_at", async () => {
    const { lib } = await setup();
    lib.saveProject(project(), "insert");
    const createdAt = lib.getProject("p1")!.createdAt;

    lib.saveProject(
      project({ title: "Renamed", description: { es: "Hola" }, categories: ["Only"], published: false }),
      "update",
    );

    const p = lib.getProject("p1")!;
    expect(p).toMatchObject({ title: "Renamed", published: false, description: { es: "Hola" }, categories: ["Only"] });
    expect(p.createdAt).toBe(createdAt);
  });

  it("is atomic: a failed insert leaves the existing project untouched", async () => {
    const { lib, db } = await setup();
    lib.saveProject(project(), "insert");

    // Same id → the INSERT violates the primary key inside the transaction.
    expect(() => lib.saveProject(project({ title: "Clobber", description: { de: "changed" } }), "insert")).toThrow(
      /UNIQUE|PRIMARY/i,
    );

    expect(lib.getProject("p1")).toMatchObject({ title: "Project One", description: { de: "Hallo", en: "Hello" } });
    // …and the connection is usable afterwards (transaction was rolled back, not left open).
    expect(() => db.exec("BEGIN IMMEDIATE; COMMIT")).not.toThrow();
  });

  it("updating a missing project throws NotFoundError and writes nothing", async () => {
    const { lib, db } = await setup();
    expect(() => lib.saveProject(project({ id: "ghost" }), "update")).toThrow(lib.NotFoundError);
    expect(count(db, "projects")).toBe(0);
    expect(count(db, "project_translations")).toBe(0);
    expect(count(db, "project_categories")).toBe(0);
  });

  it("rolls back the parent row when a child write fails", async () => {
    const { lib, db } = await setup();
    // A trigger that makes the translation insert fail mid-transaction.
    db.exec(`CREATE TRIGGER boom BEFORE INSERT ON project_translations
             BEGIN SELECT RAISE(ABORT, 'translation failed'); END`);

    expect(() => lib.saveProject(project(), "insert")).toThrow(/translation failed/);
    expect(count(db, "projects")).toBe(0);
  });
});

describe("deleteProject", () => {
  it("cascades to translations and categories", async () => {
    const { lib, db } = await setup();
    lib.saveProject(project(), "insert");
    lib.deleteProject("p1");
    expect(count(db, "projects")).toBe(0);
    expect(count(db, "project_translations")).toBe(0);
    expect(count(db, "project_categories")).toBe(0);
  });

  it("deleting an unknown id is a no-op", async () => {
    const { lib } = await setup();
    expect(() => lib.deleteProject("nope")).not.toThrow();
  });
});

describe("getAllProjects", () => {
  it("runs a constant number of queries regardless of project count (no N+1)", async () => {
    const { lib, db } = await setup();
    for (let i = 0; i < 25; i++) {
      lib.saveProject(project({ id: `p${i}`, title: `P${i}` }), "insert");
    }
    lib.invalidateProjectsCache();

    const prepare = vi.spyOn(db, "prepare");
    const all = lib.getAllProjects();

    expect(all).toHaveLength(25);
    expect(prepare).toHaveBeenCalledTimes(3);
    expect(all.every((p) => p.categories.length === 2 && p.description.de === "Hallo")).toBe(true);
  });

  it("serves from cache until a write invalidates it", async () => {
    const { lib, db } = await setup();
    lib.saveProject(project(), "insert");
    expect(lib.getAllProjects()).toHaveLength(1);

    // Raw write bypasses invalidation → still cached.
    db.prepare("INSERT INTO projects (id, title, created_at) VALUES ('raw','Raw','x')").run();
    expect(lib.getAllProjects()).toHaveLength(1);

    // A real write through the API invalidates.
    lib.saveProject(project({ id: "p2" }), "insert");
    expect(lib.getAllProjects().map((p) => p.id).sort()).toEqual(["p1", "p2", "raw"]);
  });

  it("gives projects without children empty relations rather than undefined", async () => {
    const { lib, db } = await setup();
    db.prepare("INSERT INTO projects (id, title, created_at) VALUES ('bare','Bare','x')").run();
    expect(lib.getAllProjects()[0]).toMatchObject({ description: {}, categories: [], languages: [] });
  });
});

describe("courses", () => {
  const insertCourse = (db: DatabaseSync, id: string, cert: Buffer | null) =>
    db
      .prepare(
        `INSERT INTO courses (id, title, topics, certificate, certificate_name, published, sort_order)
         VALUES (?, ?, '["A","B"]', ?, ?, 1, 0)`,
      )
      .run(id, id.toUpperCase(), cert, cert ? "c.pdf" : "");

  it("list queries expose hasCertificate but never the blob", async () => {
    const { lib, db } = await setup();
    insertCourse(db, "with", Buffer.from("%PDF-big"));
    insertCourse(db, "without", null);
    lib.invalidateCoursesCache();

    const byId = Object.fromEntries(lib.getAllCourses().map((c) => [c.id, c]));
    expect(byId.with.hasCertificate).toBe(true);
    expect(byId.without.hasCertificate).toBe(false);
    for (const c of Object.values(byId)) expect(c).not.toHaveProperty("certificate");
    expect(byId.with.topics).toEqual(["A", "B"]);
    expect(lib.getCourse("with")).not.toHaveProperty("certificate");
  });

  it("getCourse returns null for an unknown id", async () => {
    const { lib } = await setup();
    expect(lib.getCourse("nope")).toBeNull();
  });

  it("caches the list until invalidated", async () => {
    const { lib, db } = await setup();
    insertCourse(db, "a", null);
    expect(lib.getAllCourses()).toHaveLength(1);
    insertCourse(db, "b", null);
    expect(lib.getAllCourses()).toHaveLength(1);
    lib.invalidateCoursesCache();
    expect(lib.getAllCourses()).toHaveLength(2);
  });
});

describe("CV helpers", () => {
  it("return null (not undefined) when nothing is stored", async () => {
    const { lib } = await setup();
    expect(lib.getCvFile("de")).toBeNull();
    expect(lib.getCvFileData("de")).toBeNull();
    expect(lib.getCvSecretByValue("nope")).toBeNull();
    expect(lib.getCvFiles()).toEqual({ de: null, en: null });
  });

  it("caches file data until invalidated", async () => {
    const { lib, db } = await setup();
    db.prepare("INSERT INTO cv_files (lang, data, filename, size) VALUES ('en', ?, 'cv.pdf', 3)").run(Buffer.from("abc"));
    // node:sqlite hands BLOBs back as Uint8Array (typed Buffer in db.ts) — compare as text.
    const text = (lang: "en") => Buffer.from(lib.getCvFileData(lang)!).toString();
    expect(text("en")).toBe("abc");

    db.prepare("UPDATE cv_files SET data = ? WHERE lang = 'en'").run(Buffer.from("xyz"));
    expect(text("en")).toBe("abc");
    lib.invalidateCvCache("en");
    expect(text("en")).toBe("xyz");
  });

  it("secret lookup is cached, and deletion is honoured once the cache entry is dropped", async () => {
    const { lib, db } = await setup();
    db.prepare("INSERT INTO cv_secrets (label, secret) VALUES ('l', 'open-sesame')").run();
    expect(lib.getCvSecretByValue("open-sesame")).toMatchObject({ label: "l" });

    db.prepare("DELETE FROM cv_secrets").run();
    expect(lib.getCvSecretByValue("open-sesame")).not.toBeNull(); // cached ≤ 30 s
    lib.invalidateCvSecretCache("open-sesame");
    expect(lib.getCvSecretByValue("open-sesame")).toBeNull();
  });

  it("does not cache misses, so a newly created secret works at once", async () => {
    const { lib, db } = await setup();
    expect(lib.getCvSecretByValue("later")).toBeNull();
    db.prepare("INSERT INTO cv_secrets (label, secret) VALUES ('l', 'later')").run();
    expect(lib.getCvSecretByValue("later")).not.toBeNull();
  });

  it("recordCvAccess bumps the counter and stamps last_opened_at", async () => {
    const { lib, db } = await setup();
    db.prepare("INSERT INTO cv_secrets (label, secret) VALUES ('l', 'abcdefgh')").run();
    const { id } = db.prepare("SELECT id FROM cv_secrets").get() as { id: number };

    lib.recordCvAccess(id);
    lib.recordCvAccess(id);

    expect(db.prepare("SELECT view_count, last_opened_at FROM cv_secrets").get()).toMatchObject({
      view_count: 2,
      last_opened_at: expect.any(String),
    });
  });

  it("secrets are unique", async () => {
    const { db } = await setup();
    db.prepare("INSERT INTO cv_secrets (label, secret) VALUES ('a', 'same-secret')").run();
    expect(() => db.prepare("INSERT INTO cv_secrets (label, secret) VALUES ('b', 'same-secret')").run()).toThrow(
      /UNIQUE/i,
    );
  });
});
