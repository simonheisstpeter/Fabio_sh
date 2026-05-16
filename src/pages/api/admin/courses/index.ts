import type { APIRoute } from "astro";
import { getDb, invalidateCoursesCache } from "../../../../lib/db";
import { jsonError } from "../../../../lib/response";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function checkMagicBytes(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  if (buf.slice(0, 4).toString("binary") === "%PDF") return true;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  if (buf.slice(0, 4).toString("binary") === "\x89PNG") return true;
  return false;
}

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

  let certBuffer: Buffer | null = null;
  let certName = "";
  const certFile = form.get("certificate") as File | null;
  if (certFile && certFile.size > 0) {
    if (certFile.size > MAX_FILE_SIZE) return jsonError("Certificate too large (max 10 MB)", 400);
    const buf = Buffer.from(await certFile.arrayBuffer());
    if (!checkMagicBytes(buf)) return jsonError("Unsupported file type (PDF, JPG, PNG only)", 400);
    certBuffer = buf;
    certName = certFile.name;
  }

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
