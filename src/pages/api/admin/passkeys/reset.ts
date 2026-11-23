import type { APIRoute } from "astro";
import { getDb } from "../../../../lib/db";
import { resetPasskeys } from "../../../../lib/admin-auth";
import { DUMMY_HASH, verifyPassword } from "../../../../lib/password";
import { checkRateLimit, clientIp, rateLimitKeyFor, resetRateLimit } from "../../../../lib/rate-limit";
import { redirectGet, redirectTo } from "../../../../lib/response";

// Session + same-origin are enforced for /api/admin/** by the middleware.
// Resetting every passkey is destructive, so it also asks for the password
// again (re-authentication), rate limited like the login form.
const SETTINGS = "/admin/settings";
const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 5;
const MAX_PASSWORD_LENGTH = 1024; // scrypt cost scales with input; cap it

export const GET = redirectGet(SETTINGS);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirectTo(`${SETTINGS}?error=form`);
  }

  const limitKey = rateLimitKeyFor(clientIp(request, clientAddress), "reauth");
  if (!checkRateLimit(limitKey, MAX_ATTEMPTS, WINDOW_SECONDS).allowed) {
    return redirectTo(`${SETTINGS}?error=ratelimit`);
  }

  const password = String(form.get("password") ?? "");
  if (!password || password.length > MAX_PASSWORD_LENGTH)
    return redirectTo(`${SETTINGS}?error=password`);

  const cred = getDb().prepare("SELECT hash FROM admin_password WHERE id = 1").get() as
    | { hash: string }
    | undefined;
  // Same scrypt cost whether or not a password exists: no timing tell.
  const valid = await verifyPassword(password, cred?.hash ?? DUMMY_HASH);
  if (!cred) return redirectTo(`${SETTINGS}?error=nopassword`);
  if (!valid) return redirectTo(`${SETTINGS}?error=password`);
  resetRateLimit(limitKey);

  // Synchronous from here on: the password check inside resetPasskeys and
  // the delete cannot be interleaved with another request.
  const result = resetPasskeys();
  if (result.status === "no-password") return redirectTo(`${SETTINGS}?error=nopassword`);
  return redirectTo(`${SETTINGS}?ok=reset&n=${result.removed}`);
};
