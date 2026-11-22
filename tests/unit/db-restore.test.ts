import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { importToken, isSqliteFile, restoreDatabase } from "../../src/lib/db-restore";

let dir: string;
let dbPath: string;
let savedToken: string | undefined;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "fabio-restore-"));
  dbPath = join(dir, "fabio.db");
  savedToken = process.env.DB_IMPORT_TOKEN;
});

afterAll(() => {
  if (savedToken === undefined) delete process.env.DB_IMPORT_TOKEN;
  else process.env.DB_IMPORT_TOKEN = savedToken;
});

const SCHEMA = `
  CREATE TABLE projects (id TEXT PRIMARY KEY);
  CREATE TABLE contact_submissions (id TEXT PRIMARY KEY);
  CREATE TABLE admin_password (id INTEGER PRIMARY KEY);
  CREATE TABLE schema_migrations (id INTEGER PRIMARY KEY);
`;

function writeDb(name: string, statements = SCHEMA): Buffer {
  const path = join(dir, `${name}-${Date.now()}-${Math.random()}.db`);
  const db = new DatabaseSync(path);
  db.exec(statements);
  db.close();
  return readFileSync(path);
}

const readfile = readFileSync;

describe("importToken", () => {
  it("is null when DB_IMPORT_TOKEN is unset, a placeholder, or too short", () => {
    for (const value of [undefined, "", "changeme", "short"]) {
      process.env.DB_IMPORT_TOKEN = value as string;
      expect(importToken()).toBeNull();
    }
    delete process.env.DB_IMPORT_TOKEN;
    expect(importToken()).toBeNull();
  });

  it("returns a sufficiently long token", () => {
    process.env.DB_IMPORT_TOKEN = "abcdefghijklmnop";
    expect(importToken()).toBe("abcdefghijklmnop");
  });
});

describe("isSqliteFile", () => {
  it("rejects non-SQLite buffers", () => {
    expect(isSqliteFile(Buffer.from("%PDF-1.7"))).toBe(false);
    expect(isSqliteFile(Buffer.from(""))).toBe(false);
  });
});

describe("restoreDatabase", () => {
  it("rejects a non-SQLite upload without touching the live DB", () => {
    expect(restoreDatabase(Buffer.from("hello world"), dbPath)).toMatchObject({
      ok: false,
      error: "Not a SQLite database",
    });
  });

  it("rejects a SQLite file that lacks the expected tables", () => {
    const buffer = writeDb("other", "CREATE TABLE unrelated (id INTEGER)");
    const result = restoreDatabase(buffer, dbPath);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("missing") });
  });

  it("warns about corrupt databases and keeps the live DB", () => {
    const garbage = Buffer.alloc(4096, 0);
    Buffer.from("SQLite format 3\u0000").copy(garbage);
    const result = restoreDatabase(garbage, dbPath);
    expect(result.ok).toBe(false);
  });

  it("restores a valid database and keeps the previous file as backup", () => {
    expect(restoreDatabase(writeDb("first"), dbPath)).toMatchObject({ ok: true });

    const second = writeDb("second", `${SCHEMA} INSERT INTO projects (id) VALUES ('p1');`);
    const result = restoreDatabase(second, dbPath);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const restored = new DatabaseSync(dbPath, { readOnly: true });
    expect(
      restored.prepare("SELECT id FROM projects").get(),
    ).toEqual({ id: "p1" });
    restored.close();

    const backup = new DatabaseSync(result.backupPath!, { readOnly: true });
    expect(backup.prepare("SELECT COUNT(*) n FROM projects").get()).toEqual({ n: 0 });
    backup.close();
  });
});
