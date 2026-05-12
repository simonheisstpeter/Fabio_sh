import { DatabaseSync } from "node:sqlite";
import { mkdirSync, statSync } from "fs";
import { join } from "path";

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "db/fabio.db");
const backupsDir = join(process.cwd(), "backups");

mkdirSync(backupsDir, { recursive: true });

const ts = new Date().toISOString().replace(/:/g, "-").slice(0, 19);
const outPath = join(backupsDir, `fabio-${ts}.db`);

const db = new DatabaseSync(dbPath, { readOnly: true });

console.log(`Backing up ${dbPath} → ${outPath}`);
db.exec(`VACUUM INTO '${outPath}'`);
db.close();

const { size } = statSync(outPath);
console.log(`Done — ${(size / 1024).toFixed(1)} KB`);
