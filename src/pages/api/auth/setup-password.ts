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

  // Re-check synchronously, immediately before the write, with no further
  // await in between: closes the bootstrap-enrolment race where two
  // concurrent requests could both pass the earlier (pre-hash) check while
  // no credential existed yet.
  if (!canEnrolCredential(cookies)) return redirectTo("/admin/login");
  if (credentialCounts().passwords > 0) return redirectTo(`${REGISTER}?error=exists`);

  try {
    getDb().prepare("INSERT INTO admin_password (id, email, hash) VALUES (1, ?, ?)").run(email, hash);
  } catch (err: unknown) {
    // Belt-and-suspenders: the recheck above already makes this unreachable via
    // the request race it closes, but a future refactor could reopen the await
    // gap, and this keeps that failure mode a clean redirect, not a 500.
    if (err instanceof Error && /UNIQUE|PRIMARY KEY/i.test(err.message)) {
      return redirectTo(`${REGISTER}?error=exists`);
    }
    throw err;
  }

  // First-run bootstrap: sign the new admin in so the passkey step that
  // follows on the setup page is authorised.
  createSession(cookies);
  return redirectTo(`${REGISTER}?pw=set`);
};
