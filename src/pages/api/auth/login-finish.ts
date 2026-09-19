import type { APIRoute } from "astro";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getDb } from "../../../lib/db";
import { consumeChallenge, createSession } from "../../../lib/admin-auth";
import { jsonError, jsonOk, redirectGet } from "../../../lib/response";

export const GET = redirectGet("/admin/login");

export const POST: APIRoute = async ({ request, cookies }) => {
  // Burned on read: a captured assertion can't be replayed against it.
  const challenge = consumeChallenge(cookies, "login");
  if (!challenge) return jsonError("No challenge found", 400);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const credentialId = body.id;
  if (typeof credentialId !== "string" || !credentialId) {
    return jsonError("Missing credential id", 400);
  }

  const db = getDb();
  const credRow = db
    .prepare("SELECT * FROM webauthn_credentials WHERE credential_id = ?")
    .get(credentialId) as
    | { credential_id: string; public_key: string; counter: number; transports: string }
    | undefined;

  if (!credRow) return jsonError("Unknown credential", 400);

  try {
    const verification = await verifyAuthenticationResponse({
      response: body as unknown as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
      expectedChallenge: challenge,
      expectedOrigin: import.meta.env.ADMIN_ORIGIN ?? "http://localhost:4321",
      expectedRPID: import.meta.env.ADMIN_RP_ID ?? "localhost",
      credential: {
        id: credRow.credential_id,
        publicKey: Buffer.from(credRow.public_key, "base64url"),
        counter: credRow.counter,
        transports: JSON.parse(credRow.transports ?? "[]"),
      },
    });

    if (!verification.verified) return jsonError("Verification failed", 401);

    db.prepare("UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?").run(
      verification.authenticationInfo.newCounter,
      credRow.credential_id,
    );

    createSession(cookies);
    return jsonOk();
  } catch (err) {
    // Malformed or forged responses make the library throw — that's the client's
    // fault, not a server fault.
    console.warn("login-finish rejected:", err instanceof Error ? err.message : err);
    return jsonError("Verification failed", 400);
  }
};
