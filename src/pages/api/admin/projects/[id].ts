import type { APIRoute } from "astro";
import { saveProject, deleteProject, NotFoundError } from "../../../../lib/db";
import { projectFromForm } from "../../../../lib/project-form";
import { jsonError, redirectTo } from "../../../../lib/response";

const PROJECTS = "/admin/projects";

async function handlePut(id: string, form: FormData): Promise<Response> {
  const input = projectFromForm(form, id);
  if (!input.title) return jsonError("title is required", 400);

  try {
    saveProject(input, "update");
  } catch (err: unknown) {
    if (err instanceof NotFoundError) return jsonError("Project not found", 404);
    return jsonError(err instanceof Error ? err.message : "DB error", 409);
  }

  return redirectTo(PROJECTS);
}

function handleDelete(id: string): Response {
  deleteProject(id);
  return redirectTo(PROJECTS);
}

export const GET: APIRoute = () => redirectTo(PROJECTS);

export const PUT: APIRoute = async ({ request, params }) =>
  handlePut(params.id!, await request.formData());

export const DELETE: APIRoute = ({ params }) => handleDelete(params.id!);

// Browsers can't send PUT/DELETE from a plain form, so the admin UI overrides.
export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  const method = String(form.get("_method") ?? "").toUpperCase();

  if (method === "DELETE") return handleDelete(params.id!);
  if (method === "PUT") return handlePut(params.id!, form);
  return jsonError("Invalid method override", 400);
};
