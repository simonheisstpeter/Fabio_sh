import type { APIRoute } from "astro";
import { getDb, invalidateCoursesCache } from "../../../../lib/db";
import { jsonError, redirectTo } from "../../../../lib/response";
import { readUploadedFile } from "../../../../lib/upload";

const COURSES = "/admin/courses";

async function handlePut(id: string, form: FormData): Promise<Response> {
  const title = String(form.get("title") ?? "").trim();
  if (!title) return jsonError("title is required", 400);

  const platform = String(form.get("platform") ?? "").trim();
  const status = String(form.get("status") ?? "not_started");
  const progress = Math.min(100, Math.max(0, Number(form.get("progress") ?? 0) || 0));
  const url = String(form.get("url") ?? "").trim();
  const startDate = String(form.get("start_date") ?? "").trim();
  const endDate = String(form.get("end_date") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const published = form.get("published") === "1" ? 1 : 0;
  const removeCert = form.get("remove_certificate") === "1";

  const topics = String(form.get("topics") ?? "")
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const upload = await readUploadedFile(form.get("certificate") as File | null);
  if (upload && !upload.ok) return jsonError(upload.error, 400);

  // One statement instead of three near-identical ones. The certificate columns
  // are only touched when a new file arrives (mode 'set') or removal was asked
  // for (mode 'clear'); otherwise COALESCE keeps whatever is already stored.
  const certMode = upload ? "set" : removeCert ? "clear" : "keep";
  const certData = upload?.ok ? upload.buffer : null;
  const certName = upload?.ok ? upload.name : "";

  getDb()
    .prepare(
      `UPDATE courses SET
         title=?, platform=?, status=?, progress=?, topics=?, url=?,
         start_date=?, end_date=?, notes=?, published=?,
         certificate = CASE ?
           WHEN 'set'   THEN ?
           WHEN 'clear' THEN NULL
           ELSE certificate END,
         certificate_name = CASE ?
           WHEN 'set'   THEN ?
           WHEN 'clear' THEN ''
           ELSE certificate_name END
       WHERE id=?`,
    )
    .run(
      title, platform, status, progress, JSON.stringify(topics), url,
      startDate, endDate, notes, published,
      certMode, certData,
      certMode, certName,
      id,
    );

  invalidateCoursesCache();
  return redirectTo(COURSES);
}

export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  const method = String(form.get("_method") ?? "").toUpperCase();
  const id = params.id!;

  if (method === "PUT") return handlePut(id, form);

  if (method === "DELETE") {
    getDb().prepare("DELETE FROM courses WHERE id = ?").run(id);
    invalidateCoursesCache();
    return redirectTo(COURSES);
  }

  return jsonError("Invalid method override", 400);
};
