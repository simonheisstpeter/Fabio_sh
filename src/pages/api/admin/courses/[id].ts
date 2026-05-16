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

  let newCertBuffer: Buffer | null = null;
  let newCertName: string | null = null;
  const certFile = form.get("certificate") as File | null;
  if (certFile && certFile.size > 0) {
    if (certFile.size > MAX_FILE_SIZE) return jsonError("Certificate too large (max 10 MB)", 400);
    const buf = Buffer.from(await certFile.arrayBuffer());
    if (!checkMagicBytes(buf)) return jsonError("Unsupported file type (PDF, JPG, PNG only)", 400);
    newCertBuffer = buf;
    newCertName = certFile.name;
  }

  const db = getDb();

  if (newCertBuffer !== null) {
    db.prepare(
      `UPDATE courses SET
        title=?, platform=?, status=?, progress=?, topics=?, url=?,
        start_date=?, end_date=?, certificate=?, certificate_name=?, notes=?, published=?
       WHERE id=?`,
    ).run(title, platform, status, progress, JSON.stringify(topics), url,
      startDate, endDate, newCertBuffer, newCertName, notes, published, id);
  } else if (removeCert) {
    db.prepare(
      `UPDATE courses SET
        title=?, platform=?, status=?, progress=?, topics=?, url=?,
        start_date=?, end_date=?, certificate=NULL, certificate_name='', notes=?, published=?
       WHERE id=?`,
    ).run(title, platform, status, progress, JSON.stringify(topics), url,
      startDate, endDate, notes, published, id);
  } else {
    db.prepare(
      `UPDATE courses SET
        title=?, platform=?, status=?, progress=?, topics=?, url=?,
        start_date=?, end_date=?, notes=?, published=?
       WHERE id=?`,
    ).run(title, platform, status, progress, JSON.stringify(topics), url,
      startDate, endDate, notes, published, id);
  }

  invalidateCoursesCache();
  return new Response(null, { status: 302, headers: { Location: "/admin/courses" } });
}

export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  const method = String(form.get("_method") ?? "").toUpperCase();
  const id = params.id!;

  if (method === "PUT") return handlePut(id, form);

  if (method === "DELETE") {
    getDb().prepare("DELETE FROM courses WHERE id = ?").run(id);
    invalidateCoursesCache();
    return new Response(null, { status: 302, headers: { Location: "/admin/courses" } });
  }

  return jsonError("Invalid method override", 400);
};
