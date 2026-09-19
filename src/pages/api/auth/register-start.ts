import type { APIRoute } from "astro";
import {
  generateRegistrationOptions,
  type GenerateRegistrationOptionsOpts,
} from "@simplewebauthn/server";
import { getDb } from "../../../lib/db";
import { canEnrolCredential, issueChallenge } from "../../../lib/admin-auth";
import { checkRateLimit, rateLimitKeyFor } from "../../../lib/rate-limit";
import { jsonError, jsonOk, redirectGet } from "../../../lib/response";

export const GET = redirectGet("/admin/register");

export const POST: APIRoute = async ({ cookies, clientAddress }) => {
  // Only a signed-in admin (or first-run bootstrap) may add a credential.
  if (!canEnrolCredential(cookies)) return jsonError("Unauthorized", 401);
  if (!checkRateLimit(rateLimitKeyFor(clientAddress, "webauthn"), 30, 600).allowed) {
    return jsonError("Too many requests", 429);
  }

  const existingCredentials = getDb()
    .prepare("SELECT credential_id FROM webauthn_credentials")
    .all() as { credential_id: string }[];

  const opts: GenerateRegistrationOptionsOpts = {
    rpName: import.meta.env.ADMIN_RP_NAME ?? "fabio.sh admin",
    rpID: import.meta.env.ADMIN_RP_ID ?? "localhost",
    userName: "admin",
    userDisplayName: "Admin",
    attestationType: "none",
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credential_id,
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  };

  const options = await generateRegistrationOptions(opts);
  issueChallenge(cookies, options.challenge, "register");
  return jsonOk(options);
};
