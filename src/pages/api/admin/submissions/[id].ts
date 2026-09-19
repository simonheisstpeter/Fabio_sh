import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/db";
import { jsonError, methodOverride, redirectGet, redirectTo } from "../../../../lib/response";

const SUBMISSIONS = "/admin/submissions";

function remove(id: string): void {
  getDb().prepare("DELETE FROM contact_submissions WHERE id = ?").run(id);
}

export const GET = redirectGet(SUBMISSIONS);

export const DELETE: APIRoute = ({ params }) => {
  remove(params.id!);
  return new Response(null, { status: 204 });
};

// Plain-form fallback (no JS): a POST carrying `_method=DELETE`.
export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  if (methodOverride(form) !== "DELETE") return jsonError("Invalid method", 400);
  remove(params.id!);
  return redirectTo(SUBMISSIONS);
};
