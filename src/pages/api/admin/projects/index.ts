import type { APIRoute } from "astro";
import { getDb, parseLanguages, invalidateProjectsCache } from "../../../../lib/db";
import { jsonError } from "../../../../lib/response";

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: "/admin/projects" } });

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();

  const id = String(form.get("id") ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const title = String(form.get("title") ?? "").trim();

  if (!id || !title) return jsonError("id and title are required", 400);

  const categories = String(form.get("categories") ?? "")
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);
  const languages = parseLanguages(String(form.get("languages") ?? ""));

  try {
    getDb()
      .prepare(
        `INSERT INTO projects
       (id, title, desc_de, desc_en, desc_es, desc_it, desc_ja, desc_pt,
        categories, published, finished, online, image, url, languages)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        title,
        String(form.get("desc_de") ?? ""),
        String(form.get("desc_en") ?? ""),
        String(form.get("desc_es") ?? ""),
        String(form.get("desc_it") ?? ""),
        String(form.get("desc_ja") ?? ""),
        String(form.get("desc_pt") ?? ""),
        JSON.stringify(categories),
        form.get("published") ? 1 : 0,
        form.get("finished") ? 1 : 0,
        form.get("online") ? 1 : 0,
        String(form.get("image") ?? ""),
        String(form.get("url") ?? ""),
        JSON.stringify(languages),
      );
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "DB error", 409);
  }

  invalidateProjectsCache();
  return new Response(null, { status: 302, headers: { Location: "/admin/projects" } });
};
