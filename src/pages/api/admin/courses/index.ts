import type { APIRoute } from "astro";
import { getDb, invalidateCoursesCache } from "../../../../lib/db";
import { jsonError } from "../../../../lib/response";

import { readUploadedFile } from "../../../../lib/upload";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();

  const id = String(form.get("id") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const title = String(form.get("title") ?? "").trim();
  if (!id || !title) return jsonError("id and title are required", 400);

  const platform = String(form.get("platform") ?? "").trim();
  const status = String(form.get("status") ?? "not_started");
  const progress = Math.min(100, Math.max(0, Number(form.get("progress") ?? 0) || 0));
  const url = String(form.get("url") ?? "").trim();
  const startDate = String(form.get("start_date") ?? "").trim();
  const endDate = String(form.get("end_date") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const published = form.get("published") === "1" ? 1 : 0;

  const topics = String(form.get("topics") ?? "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const upload = await readUploadedFile(form.get("certificate") as File | null);
  if (upload && !upload.ok) return jsonError(upload.error, 400);
  const certBuffer = upload?.ok ? upload.buffer : null;
  const certName = upload?.ok ? upload.name : "";

  try {
    getDb()
      .prepare(
        `INSERT INTO courses
          (id, title, platform, status, progress, topics, url,
           start_date, end_date, certificate, certificate_name, notes, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id, title, platform, status, progress,
        JSON.stringify(topics), url, startDate, endDate,
        certBuffer, certName, notes, published,
      );
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "DB error", 409);
  }

  invalidateCoursesCache();
  return redirect("/admin/courses");
};
