import type { APIRoute } from "astro";
import { getDb, getCvSecretByValue, recordCvAccess, CV_COOKIE, hashIp } from "../../../lib/db";

const RATE_LIMIT = 10; // max guesses
const RATE_WINDOW = 3600; // per hour (seconds)

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // Rate limit secret guesses per IP (stored with cv: prefix to avoid collision)
  const ipHash = "cv:" + hashIp(getClientIp(request));
  const db = getDb();

  const row = db
    .prepare("SELECT count, window_start FROM rate_limits WHERE ip_hash = ?")
    .get(ipHash) as { count: number; window_start: string } | undefined;

  if (row) {
    const elapsed = (Date.now() - new Date(row.window_start + "Z").getTime()) / 1000;
    if (elapsed < RATE_WINDOW) {
      if (row.count >= RATE_LIMIT) return redirect("/cv?error=1");
      db.prepare("UPDATE rate_limits SET count = count + 1 WHERE ip_hash = ?").run(ipHash);
    } else {
      db.prepare(
        "UPDATE rate_limits SET count = 1, window_start = CURRENT_TIMESTAMP WHERE ip_hash = ?",
      ).run(ipHash);
    }
  } else {
    db.prepare("INSERT INTO rate_limits (ip_hash) VALUES (?)").run(ipHash);
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
