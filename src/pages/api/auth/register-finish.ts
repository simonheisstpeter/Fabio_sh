import type { APIRoute } from "astro";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getDb } from "../../../lib/db";
import { canEnrolCredential, consumeChallenge, createSession } from "../../../lib/admin-auth";
import { jsonError, jsonOk, redirectGet } from "../../../lib/response";

export const GET = redirectGet("/admin/register");

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!canEnrolCredential(cookies)) return jsonError("Unauthorized", 401);

  // Burned on read: a challenge can be answered exactly once.
  const challenge = consumeChallenge(cookies, "register");
  if (!challenge) return jsonError("No challenge found", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body as Parameters<typeof verifyRegistrationResponse>[0]["response"],
      expectedChallenge: challenge,
      expectedOrigin: import.meta.env.ADMIN_ORIGIN ?? "http://localhost:4321",
      expectedRPID: import.meta.env.ADMIN_RP_ID ?? "localhost",
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonError("Verification failed", 400);
    }

    const { credential } = verification.registrationInfo;

    getDb()
      .prepare(
        `INSERT INTO webauthn_credentials
         (credential_id, public_key, counter, device_type, backed_up, transports)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        credential.id,
        Buffer.from(credential.publicKey).toString("base64url"),
        credential.counter,
        verification.registrationInfo.credentialDeviceType ?? null,
        verification.registrationInfo.credentialBackedUp ? 1 : 0,
        JSON.stringify(
          (body as { response?: { transports?: string[] } }).response?.transports ?? [],
        ),
      );

    createSession(cookies);
    return jsonOk();
  } catch (err) {
    // Malformed or forged responses make the library throw — that's the client's
    // fault, not a server fault.
    console.warn("register-finish rejected:", err instanceof Error ? err.message : err);
    return jsonError("Verification failed", 400);
  }
};
