import type { APIRoute } from "astro";
import { getDb, invalidateCoursesCache } from "../../../../lib/db";
import { courseFromForm } from "../../../../lib/course-form";
import { slugify } from "../../../../lib/project-form";
import { jsonError, redirectTo } from "../../../../lib/response";
import { readUploadedFile } from "../../../../lib/upload";

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();

  const id = slugify(String(form.get("id") ?? ""));
  if (!id) return jsonError("id and title are required", 400);

  const parsed = courseFromForm(form);
  if ("error" in parsed) return jsonError(parsed.error, 400);
  const c = parsed.input;

  const upload = await readUploadedFile(form.get("certificate") as File | null);
  if (upload && !upload.ok) return jsonError(upload.error, 400);

  try {
    getDb()
      .prepare(
        `INSERT INTO courses
          (id, title, platform, status, progress, topics, url,
           start_date, end_date, certificate, certificate_name, notes, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id, c.title, c.platform, c.status, c.progress,
        JSON.stringify(c.topics), c.url, c.startDate, c.endDate,
        upload?.ok ? upload.buffer : null, upload?.ok ? upload.name : "",
        c.notes, c.published,
      );
  } catch (err: unknown) {
    // Only a duplicate id is the caller's fault; anything else is ours, and the
    // raw SQLite message shouldn't leak either way.
    if (err instanceof Error && /UNIQUE|PRIMARY KEY/i.test(err.message)) {
      return jsonError(`A course with id "${id}" already exists`, 409);
    }
    console.error("course insert failed:", err);
    return jsonError("Could not save course", 500);
  }

  invalidateCoursesCache();
  return redirectTo("/admin/courses");
};
