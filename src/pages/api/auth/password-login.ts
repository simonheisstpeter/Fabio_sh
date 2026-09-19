import type { APIRoute } from "astro";
import { verifyPassword, DUMMY_HASH } from "../../../lib/password";
import { getDb } from "../../../lib/db";
import { createSession } from "../../../lib/admin-auth";
import { checkRateLimit, rateLimitKeyFor, resetRateLimit } from "../../../lib/rate-limit";
import { jsonError, jsonOk, redirectGet } from "../../../lib/response";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;
const MAX_PASSWORD_LENGTH = 1024; // scrypt cost scales with input; cap it

export const GET = redirectGet("/admin/login");

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Invalid form data", 400);
  }

  // Honeypot + timing
  if (form.get("website")) return new Response(null, { status: 200 });
  const ts = Number(form.get("_t") ?? 0);
  if (ts && Date.now() - ts < 1000) return new Response(null, { status: 200 });

  // Every attempt counts (one atomic UPSERT); a successful login clears it.
  const limitKey = rateLimitKeyFor(clientAddress, "login");
  if (!checkRateLimit(limitKey, MAX_ATTEMPTS, WINDOW_SECONDS).allowed) {
    return jsonError("Too many attempts. Try again later.", 429);
  }

  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password || password.length > MAX_PASSWORD_LENGTH) {
    return jsonError("Email and password required.", 400);
  }

  const cred = getDb().prepare("SELECT email, hash FROM admin_password WHERE id = 1").get() as
    | { email: string; hash: string }
    | undefined;

  // Always run scrypt to prevent timing attacks
  const valid = await verifyPassword(password, cred?.hash ?? DUMMY_HASH);

  if (!valid || cred?.email !== email) return jsonError("Invalid credentials.", 401);

  resetRateLimit(limitKey);
  createSession(cookies);
  return jsonOk();
};
