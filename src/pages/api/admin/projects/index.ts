import type { APIRoute } from "astro";
import { saveProject } from "../../../../lib/db";
import { projectFromForm, slugify } from "../../../../lib/project-form";
import { jsonError, redirectGet, redirectTo } from "../../../../lib/response";

const PROJECTS = "/admin/projects";

export const GET = redirectGet(PROJECTS);

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const id = slugify(String(form.get("id") ?? ""));
  const input = projectFromForm(form, id);

  if (!input.id || !input.title) return jsonError("id and title are required", 400);

  try {
    saveProject(input, "insert");
  } catch (err: unknown) {
    if (err instanceof Error && /UNIQUE|PRIMARY KEY/i.test(err.message)) {
      return jsonError(`A project with id "${input.id}" already exists`, 409);
    }
    console.error("project insert failed:", err);
    return jsonError("Could not save project", 500);
  }

  return redirectTo(PROJECTS);
};
