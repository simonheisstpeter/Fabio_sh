import type { APIRoute } from "astro";
import { getCvSecretByValue, recordCvAccess, CV_COOKIE } from "../../../lib/db";
import { secureCookie } from "../../../lib/admin-auth";
import { checkRateLimit, rateLimitKeyFor } from "../../../lib/rate-limit";

const RATE_LIMIT = 10; // max guesses
const RATE_WINDOW = 3600; // per hour (seconds)
const DENIED = "/cv?error=1";

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
  // Own namespace keeps guess attempts off the contact-form counter.
  if (!checkRateLimit(rateLimitKeyFor(clientAddress, "cv"), RATE_LIMIT, RATE_WINDOW).allowed) {
    return redirect(DENIED);
  }

  let secret = "";
  try {
    secret = String((await request.formData()).get("secret") ?? "").trim();
  } catch {
    return redirect(DENIED);
  }
  if (!secret) return redirect(DENIED);

  const secretRow = getCvSecretByValue(secret);
  if (!secretRow) return redirect(DENIED);

  recordCvAccess(secretRow.id);

  // Session cookie — no maxAge/expires so it dies when the browser closes,
  // requiring the recipient to re-enter the code on every fresh visit.
  cookies.set(CV_COOKIE, secret, secureCookie());

  return redirect("/cv");
};
