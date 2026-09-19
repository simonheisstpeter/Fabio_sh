import type { APIRoute } from "astro";
import type { DatabaseSync } from "node:sqlite";
import { getDb } from "../../lib/db";
import { checkRateLimit, rateLimitKeyFor } from "../../lib/rate-limit";
import { jsonError, jsonOk, redirectGet, redirectTo } from "../../lib/response";

type Stmts = {
  insertSubmission: ReturnType<DatabaseSync["prepare"]>;
};
let _stmts: Stmts | null = null;
function stmts(): Stmts {
  if (_stmts) return _stmts;
  _stmts = {
    insertSubmission: getDb().prepare(
      "INSERT INTO contact_submissions (name, email, message, ip_hash) VALUES (?, ?, ?, ?)",
    ),
  };
  return _stmts;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RATE_LIMIT = 3; // max submissions
const RATE_WINDOW = 3600; // per hour (seconds)
const MIN_SUBMIT_MS = 3000; // min 3 s between page load and submit
const MAX_BODY_BYTES = 16 * 1024; // the form is three short text fields

/** Same-site path to send a no-JS visitor back to, `?sent=1` appended. */
function backToForm(request: Request): string {
  let path = "/#contact";
  try {
    const referer = new URL(request.headers.get("referer") ?? "", request.url);
    // Only ever a path on this host — a foreign or `//host` Referer must not
    // turn this endpoint into an open redirect.
    if (referer.host === new URL(request.url).host && !referer.pathname.startsWith("//")) {
      referer.searchParams.set("sent", "1");
      path = referer.pathname + "?" + referer.searchParams.toString();
    }
  } catch {
    // unparsable Referer → fall back to the default
  }
  return path;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Reject oversized bodies before buffering them into FormData.
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return jsonError("Request too large", 413);

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return jsonError("Invalid form data");
  }

  // ── 1. Honeypot ──────────────────────────────────────────────────────────
  // Honeypot / timing hits are silently "accepted" — do NOT reveal we discarded it.
  const honeypot = (data.get("website") ?? "") as string;
  if (honeypot.trim().length > 0) return jsonOk();

  // ── 2. Timing check ──────────────────────────────────────────────────────
  const ts = parseInt((data.get("_t") ?? "") as string, 10);
  if (isNaN(ts) || Date.now() - ts < MIN_SUBMIT_MS) return jsonOk();

  // ── 3. Validation ─────────────────────────────────────────────────────────
  const name = ((data.get("name") ?? "") as string).trim();
  const email = ((data.get("email") ?? "") as string).trim();
  const message = ((data.get("message") ?? "") as string).trim();

  if (name.length < 2 || name.length > 100) return jsonError("Name must be 2–100 characters");
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return jsonError("Please enter a valid email address");
  }
  if (message.length < 10 || message.length > 2000) {
    return jsonError("Message must be 10–2000 characters");
  }

  // ── 4. Rate limiting (single atomic UPSERT — see lib/rate-limit.ts) ───────
  const ipHash = rateLimitKeyFor(clientAddress, "contact");
  if (!checkRateLimit(ipHash, RATE_LIMIT, RATE_WINDOW).allowed) {
    return jsonError("Too many submissions. Please try again later.", 429);
  }

  // ── 5. Store submission ───────────────────────────────────────────────────
  stmts().insertSubmission.run(name, email, message, ipHash);

  // ── 6. Respond ────────────────────────────────────────────────────────────
  // JS-enhanced clients ask for JSON; a plain form submit gets redirected back.
  if (request.headers.get("accept")?.includes("application/json")) return jsonOk();
  return redirectTo(backToForm(request), 303);
};

export const GET = redirectGet("/#contact");
