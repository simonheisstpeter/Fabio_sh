import type { APIRoute } from "astro";

const JSON_HEADERS = { "Content-Type": "application/json" };

export function jsonError(message: string, status = 422): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

export function jsonOk(data: unknown = { ok: true }): Response {
  return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
}

/** Post/Redirect/Get after a form submission. */
export function redirectTo(path: string, status = 302): Response {
  return new Response(null, { status, headers: { Location: path } });
}

/** `GET` handler for POST-only endpoints: bounce a stray visit to `path`. */
export const redirectGet =
  (path: string): APIRoute =>
  () =>
    redirectTo(path);

/**
 * Plain HTML forms can only GET/POST, so the admin UI tunnels PUT/DELETE
 * through a hidden `_method` field. Returns the upper-cased override, or "".
 */
export function methodOverride(form: FormData): string {
  return String(form.get("_method") ?? "").toUpperCase();
}
