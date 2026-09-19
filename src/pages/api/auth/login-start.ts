import type { APIRoute } from "astro";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getDb } from "../../../lib/db";
import { issueChallenge } from "../../../lib/admin-auth";
import { checkRateLimit, rateLimitKeyFor } from "../../../lib/rate-limit";
import { jsonError, jsonOk, redirectGet } from "../../../lib/response";

export const GET = redirectGet("/admin/login");

export const POST: APIRoute = async ({ cookies, clientAddress }) => {
  // Also bounds how many challenge rows an anonymous caller can create.
  if (!checkRateLimit(rateLimitKeyFor(clientAddress, "webauthn"), 30, 600).allowed) {
    return jsonError("Too many requests", 429);
  }

  const { n } = getDb().prepare("SELECT COUNT(*) as n FROM webauthn_credentials").get() as {
    n: number;
  };
  if (n === 0) return jsonError("No passkeys registered", 400);

  // Omit allowCredentials so the browser surfaces all discoverable passkeys for
  // this rpID. The server verifies the credential is authorized in login-finish.
  const options = await generateAuthenticationOptions({
    rpID: import.meta.env.ADMIN_RP_ID ?? "localhost",
    userVerification: "required",
  });

  issueChallenge(cookies, options.challenge, "login");
  return jsonOk(options);
};
