import type { APIRoute } from "astro";
import { getDb, type CourseRow } from "../../../../lib/db";
import { validateSession } from "../../../../lib/admin-auth";

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  return "application/octet-stream";
}

export const GET: APIRoute = ({ params, cookies }) => {
  const row = getDb()
    .prepare("SELECT certificate, certificate_name, published FROM courses WHERE id = ?")
    .get(params.id!) as
    | Pick<CourseRow, "certificate" | "certificate_name" | "published">
    | undefined;

  // Unpublished courses stay private — their certificates included — except
  // to the admin previewing them. Same 404 either way, so ids can't be probed.
  const visible = row && (row.published === 1 || validateSession(cookies));
  if (!row || !row.certificate || !visible) return new Response("Not found", { status: 404 });

  return new Response(row.certificate, {
    headers: {
      "Content-Type": mimeFromName(row.certificate_name),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.certificate_name)}`,
      // `private` when it may be an unpublished preview; shared caches must not keep it.
      "Cache-Control": row.published === 1 ? "public, max-age=3600" : "private, no-store",
    },
  });
};
