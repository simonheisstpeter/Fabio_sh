import type { APIRoute } from "astro";
import { getCvSecretByValue, recordCvAccess, CV_COOKIE } from "../../../lib/db";
import { checkRateLimit, rateLimitKeyFor } from "../../../lib/rate-limit";

const RATE_LIMIT = 10; // max guesses
const RATE_WINDOW = 3600; // per hour (seconds)

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // "cv:" namespace keeps guess attempts off the contact-form counter.
  const ipHash = rateLimitKeyFor(request, "cv:");
  if (!checkRateLimit(ipHash, RATE_LIMIT, RATE_WINDOW).allowed) {
    return redirect("/cv?error=1");
  }

  const form = await request.formData();
  const secret = String(form.get("secret") ?? "").trim();

  if (!secret) return redirect("/cv?error=1");

  const secretRow = getCvSecretByValue(secret);
  if (!secretRow) return redirect("/cv?error=1");

  recordCvAccess(secretRow.id);

  // Session cookie — no maxAge/expires so it dies when the browser closes,
  // requiring the recipient to re-enter the code on every fresh visit.
  cookies.set(CV_COOKIE, secret, {
    httpOnly: true,
    sameSite: "strict",
    secure: import.meta.env.PROD,
    path: "/",
  });

  return redirect("/cv");
};
