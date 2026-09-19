import type { APIRoute } from "astro";
import { getDb, invalidateCoursesCache } from "../../../../lib/db";
import { courseFromForm } from "../../../../lib/course-form";
import { jsonError, methodOverride, redirectTo } from "../../../../lib/response";
import { readUploadedFile } from "../../../../lib/upload";

const COURSES = "/admin/courses";

async function handlePut(id: string, form: FormData): Promise<Response> {
  const parsed = courseFromForm(form);
  if ("error" in parsed) return jsonError(parsed.error, 400);
  const c = parsed.input;

  const upload = await readUploadedFile(form.get("certificate") as File | null);
  if (upload && !upload.ok) return jsonError(upload.error, 400);

  // One statement instead of three near-identical ones. The certificate columns
  // are only touched when a new file arrives (mode 'set') or removal was asked
  // for (mode 'clear'); otherwise the stored values are kept.
  const removeCert = form.get("remove_certificate") === "1";
  const certMode = upload ? "set" : removeCert ? "clear" : "keep";
  const certData = upload?.ok ? upload.buffer : null;
  const certName = upload?.ok ? upload.name : "";

  const info = getDb()
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
      c.title, c.platform, c.status, c.progress, JSON.stringify(c.topics), c.url,
      c.startDate, c.endDate, c.notes, c.published,
      certMode, certData,
      certMode, certName,
      id,
    );
  if (info.changes === 0) return jsonError("Course not found", 404);

  invalidateCoursesCache();
  return redirectTo(COURSES);
}

function handleDelete(id: string): Response {
  getDb().prepare("DELETE FROM courses WHERE id = ?").run(id);
  invalidateCoursesCache();
  return redirectTo(COURSES);
}

// Browsers can't send PUT/DELETE from a plain form, so the admin UI overrides.
export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  const method = methodOverride(form);

  if (method === "PUT") return handlePut(params.id!, form);
  if (method === "DELETE") return handleDelete(params.id!);
  return jsonError("Invalid method override", 400);
};
