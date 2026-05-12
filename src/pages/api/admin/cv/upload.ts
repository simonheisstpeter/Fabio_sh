import type { APIRoute } from "astro";
import { getDb, invalidateCvCache, CV_LANGS, type CvLang } from "../../../../lib/db";
import { jsonError } from "../../../../lib/response";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const lang = String(form.get("lang") ?? "") as CvLang;
  const file = form.get("cv") as File | null;

  if (!(CV_LANGS as readonly string[]).includes(lang)) return jsonError("Invalid language", 400);
  if (!file || file.size === 0) return jsonError("No file provided", 400);

  const buffer = Buffer.from(await file.arrayBuffer());

  // Verify PDF magic bytes — MIME type alone is client-controlled
  if (buffer.length < 4 || buffer.slice(0, 4).toString("binary") !== "%PDF") {
    return jsonError("File is not a valid PDF", 400);
  }

  getDb()
    .prepare(
      `INSERT INTO cv_files (lang, data, filename, size, uploaded_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(lang) DO UPDATE SET
       data = excluded.data, filename = excluded.filename,
       size = excluded.size, uploaded_at = excluded.uploaded_at`,
    )
    .run(lang, buffer, file.name, file.size);

  invalidateCvCache(lang);

  return redirect("/admin/cv");
};
