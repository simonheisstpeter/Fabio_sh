import type { APIRoute } from 'astro';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getDb } from '../../../lib/db';
import { createSession } from '../../../lib/admin-auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const challenge = cookies.get('__wac')?.value;
  if (!challenge) {
    return new Response(JSON.stringify({ error: 'No challenge found' }), { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const credentialId = body.id as string;
  if (!credentialId) {
    return new Response(JSON.stringify({ error: 'Missing credential id' }), { status: 400 });
  }

  const db = getDb();
  const credRow = db
    .prepare('SELECT * FROM webauthn_credentials WHERE credential_id = ?')
    .get(credentialId) as
    | { credential_id: string; public_key: string; counter: number; transports: string }
    | undefined;

  if (!credRow) {
    return new Response(JSON.stringify({ error: 'Unknown credential' }), { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
      expectedChallenge: challenge,
      expectedOrigin: import.meta.env.ADMIN_ORIGIN ?? 'http://localhost:4321',
      expectedRPID: import.meta.env.ADMIN_RP_ID ?? 'localhost',
      credential: {
        id: credRow.credential_id,
        publicKey: Buffer.from(credRow.public_key, 'base64url'),
        counter: credRow.counter,
        transports: JSON.parse(credRow.transports ?? '[]'),
      },
    });

    if (!verification.verified) {
      return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 401 });
    }

    // Update counter
    db.prepare(
      'UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?'
    ).run(verification.authenticationInfo.newCounter, credRow.credential_id);

    cookies.delete('__wac', { path: '/' });
    createSession(cookies);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('login-finish error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
