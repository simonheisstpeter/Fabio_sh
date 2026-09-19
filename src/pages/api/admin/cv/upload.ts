import type { APIRoute } from "astro";
import { getDb, invalidateCvCache, CV_LANGS, type CvLang } from "../../../../lib/db";
import { jsonError, redirectTo } from "../../../../lib/response";
import { readUploadedFile } from "../../../../lib/upload";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const lang = String(form.get("lang") ?? "") as CvLang;

  if (!(CV_LANGS as readonly string[]).includes(lang)) return jsonError("Invalid language", 400);

  // Shared validation: size cap + magic bytes, PDF only.
  const upload = await readUploadedFile(form.get("cv") as File | null, ["pdf"]);
  if (!upload) return jsonError("No file provided", 400);
  if (!upload.ok) return jsonError(upload.error, 400);

  getDb()
    .prepare(
      `INSERT INTO cv_files (lang, data, filename, size, uploaded_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(lang) DO UPDATE SET
         data = excluded.data, filename = excluded.filename,
         size = excluded.size, uploaded_at = excluded.uploaded_at`,
    )
    .run(lang, upload.buffer, upload.name, upload.buffer.length);

  invalidateCvCache(lang);

  return redirectTo("/admin/cv");
};
