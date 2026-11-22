import type { APIRoute } from "astro";
import { timingSafeEqual } from "node:crypto";
import { join } from "node:path";
import { jsonError, jsonOk, redirectGet } from "../../lib/response.js";
import { importToken, restoreDatabase } from "../../lib/db-restore.js";

export const GET = redirectGet("/");

export const POST: APIRoute = async ({ request }) => {
  const token = importToken();
  if (!token) return jsonError("Not found", 404);

  const provided = request.headers.get("x-import-token") ?? "";
  const given = Buffer.from(provided);
  const expected = Buffer.from(token);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return jsonError("Unauthorized", 401);
  }

  const form = await request.formData();
  const file = form.get("db");
  if (!(file instanceof File) || file.size === 0) {
    return jsonError("No database file provided (field \"db\")", 400);
  }

  const dbPath = process.env.DATABASE_PATH ?? join(process.cwd(), "db/fabio.db");
  const result = restoreDatabase(Buffer.from(await file.arrayBuffer()), dbPath);
  if (!result.ok) return jsonError(result.error, 400);

  // The server may hold the old DB open; exiting lets the platform restart the
  // container, which re-runs migrations (and only those) against the new file.
  setTimeout(() => process.exit(1), 500);

  return jsonOk({
    message: "Database restored. The container is restarting; allow a minute.",
    backups: { previous: result.backupPath },
  });
};
