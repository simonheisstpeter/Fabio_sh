import type { APIRoute } from "astro";
import { getDb, invalidateCvSecretCache } from "../../../../../lib/db";
import { jsonError } from "../../../../../lib/response";

export const DELETE: APIRoute = ({ params, redirect }) => {
  const id = Number(params.id);
  if (!id) return jsonError("Invalid id", 400);

  const db = getDb();
  const row = db.prepare("SELECT secret FROM cv_secrets WHERE id = ?").get(id) as {
    secret: string;
  } | null;
  if (row) {
    db.prepare("DELETE FROM cv_secrets WHERE id = ?").run(id);
    invalidateCvSecretCache(row.secret);
  }

  return redirect("/admin/cv");
};
