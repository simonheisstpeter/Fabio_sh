import type { APIRoute } from "astro";
import { hashPassword } from "../../../lib/password";
import { getDb } from "../../../lib/db";
import { canEnrolCredential, createSession, credentialCounts } from "../../../lib/admin-auth";
import { redirectGet, redirectTo } from "../../../lib/response";

const REGISTER = "/admin/register";

export const GET = redirectGet(REGISTER);

export const POST: APIRoute = async ({ request, cookies }) => {
  // Same gate as passkey enrolment: signed in, or nothing set up yet.
  if (!canEnrolCredential(cookies)) return redirectTo("/admin/login");

  if (credentialCounts().passwords > 0) return redirectTo(`${REGISTER}?error=exists`);

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm_password") ?? "");

  if (!email || !password) return redirectTo(`${REGISTER}?error=missing`);
  if (password !== confirm) return redirectTo(`${REGISTER}?error=mismatch`);
  if (password.length < 12) return redirectTo(`${REGISTER}?error=short`);

  const hash = await hashPassword(password);
  getDb().prepare("INSERT INTO admin_password (id, email, hash) VALUES (1, ?, ?)").run(email, hash);

  // First-run bootstrap: sign the new admin in so the passkey step that
  // follows on the setup page is authorised.
  createSession(cookies);
  return redirectTo(`${REGISTER}?pw=set`);
};
