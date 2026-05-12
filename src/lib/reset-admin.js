import { DatabaseSync } from "node:sqlite";
import { join } from "path";

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "db/fabio.db");
const db = new DatabaseSync(dbPath);

db.exec("DELETE FROM admin_password");
db.exec("DELETE FROM admin_sessions");
db.close();

console.log("Admin password and sessions cleared. Visit /admin/register to set a new password.");
