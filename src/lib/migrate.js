/**
 * Migration CLI — for inspecting or applying migrations deliberately.
 *
 *   node src/lib/migrate.js status     list applied / pending
 *   node src/lib/migrate.js up         apply pending migrations
 *   node src/lib/migrate.js up --no-backup
 *
 * The container entrypoint runs `up` before starting the server (see
 * docker-entrypoint.sh), and db.ts migrates lazily as a fallback. Use this to
 * check state or to migrate ahead of a deploy. Safe to run twice.
 */
import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { migrationStatus, pendingMigrations, runMigrations } from "./migrate-runner.js";

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "db/fabio.db");
const command = process.argv[2] ?? "status";

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA busy_timeout = 5000");

console.log(`database: ${dbPath}\n`);

if (command === "status") {
  const rows = migrationStatus(db);
  for (const r of rows) {
    const mark = r.applied ? "applied" : "PENDING";
    console.log(`  [${mark}] ${String(r.id).padStart(3, "0")}_${r.name}${r.appliedAt ? `  (${r.appliedAt})` : ""}`);
  }
  const pending = rows.filter((r) => !r.applied).length;
  console.log(`\n${rows.length - pending} applied, ${pending} pending`);
} else if (command === "up") {
  const pending = pendingMigrations(db);
  if (pending.length === 0) {
    console.log("already up to date");
  } else {
    const { applied, backupPath } = runMigrations(db, {
      dbPath,
      backup: !process.argv.includes("--no-backup"),
      log: (msg) => console.log(msg),
    });
    console.log(`\napplied ${applied.length} migration(s)`);
    if (backupPath) console.log(`backup: ${backupPath}`);
  }
} else {
  console.error(`unknown command "${command}" — expected "status" or "up"`);
  process.exitCode = 1;
}

db.close();
