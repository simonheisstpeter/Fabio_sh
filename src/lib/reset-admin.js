import { DatabaseSync } from "node:sqlite";
import { join } from "path";

const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "db/fabio.db");
const db = new DatabaseSync(dbPath);

// Enrolment is locked to signed-in admins once any credential exists, so a
// full reset has to clear passkeys too — otherwise a lost passkey plus a reset
// password would leave nothing to sign in with.
db.exec("DELETE FROM admin_password");
db.exec("DELETE FROM webauthn_credentials");
db.exec("DELETE FROM admin_sessions");
db.exec("DELETE FROM auth_challenges");
db.close();

console.log("Admin password, passkeys and sessions cleared. Visit /admin/register to set up new credentials.");
