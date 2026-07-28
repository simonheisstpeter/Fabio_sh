import type { APIRoute } from "astro";
import { saveProject } from "../../../../lib/db";
import { projectFromForm, slugify } from "../../../../lib/project-form";
import { jsonError, redirectTo } from "../../../../lib/response";

const PROJECTS = "/admin/projects";

export const GET: APIRoute = () => redirectTo(PROJECTS);

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const id = slugify(String(form.get("id") ?? ""));
  const input = projectFromForm(form, id);

  if (!input.id || !input.title) return jsonError("id and title are required", 400);

  try {
    saveProject(input, "insert");
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : "DB error", 409);
  }

  return redirectTo(PROJECTS);
};
