const JSON_HEADERS = { "Content-Type": "application/json" };

export function jsonError(message: string, status = 422): Response {
  return new Response(JSON.stringify({ error: message }), { status, headers: JSON_HEADERS });
}

export function jsonOk(data: unknown = { ok: true }): Response {
  return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
}
