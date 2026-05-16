import type { APIRoute } from "astro";
import { getDb, type CourseRow } from "../../../../lib/db";

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  return "application/octet-stream";
}

export const GET: APIRoute = ({ params }) => {
  const row = getDb()
    .prepare("SELECT certificate, certificate_name FROM courses WHERE id = ?")
    .get(params.id!) as Pick<CourseRow, "certificate" | "certificate_name"> | undefined;

  if (!row || !row.certificate) return new Response("Not found", { status: 404 });

  return new Response(row.certificate, {
    headers: {
      "Content-Type": mimeFromName(row.certificate_name),
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(row.certificate_name)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
};
