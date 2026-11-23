import type { APIRoute } from "astro";
import { removePasskey } from "../../../../lib/admin-auth";
import { jsonError, methodOverride, redirectGet, redirectTo } from "../../../../lib/response";

// Session + same-origin are enforced for /api/admin/** by the middleware.
const SETTINGS = "/admin/settings";

function decodeId(raw: string | undefined): string {
  try {
    return decodeURIComponent(raw ?? "");
  } catch {
    return "";
  }
}

export const GET = redirectGet(SETTINGS);

export const DELETE: APIRoute = ({ params }) => {
  const result = removePasskey(decodeId(params.id));
  if (result === "not-found") return jsonError("Passkey not found", 404);
  if (result === "last-credential") {
    return jsonError(
      "This is your last way to sign in. Add another passkey or set a password first.",
      409,
    );
  }
  return new Response(null, { status: 204 });
};

// Plain-form fallback (no JS): a POST carrying `_method=DELETE`.
export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  if (methodOverride(form) !== "DELETE") return jsonError("Invalid method", 400);
  const result = removePasskey(decodeId(params.id));
  if (result === "not-found") return redirectTo(`${SETTINGS}?error=notfound`);
  if (result === "last-credential") return redirectTo(`${SETTINGS}?error=last`);
  return redirectTo(`${SETTINGS}?ok=removed`);
};
