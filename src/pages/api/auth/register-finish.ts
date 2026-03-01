import type { APIRoute } from 'astro';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getDb } from '../../../lib/db';
import { createSession } from '../../../lib/admin-auth';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/register' } });

export const POST: APIRoute = async ({ request, cookies }) => {
  const challenge = cookies.get('__wac')?.value;
  if (!challenge) {
    return new Response(JSON.stringify({ error: 'No challenge found' }), { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body as Parameters<typeof verifyRegistrationResponse>[0]['response'],
      expectedChallenge: challenge,
      expectedOrigin: import.meta.env.ADMIN_ORIGIN ?? 'http://localhost:4321',
      expectedRPID: import.meta.env.ADMIN_RP_ID ?? 'localhost',
    });

    if (!verification.verified || !verification.registrationInfo) {
      return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 400 });
    }

    const { credential } = verification.registrationInfo;

    const db = getDb();
    db.prepare(
      `INSERT OR REPLACE INTO webauthn_credentials
       (credential_id, public_key, counter, device_type, backed_up, transports)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      credential.id,
      Buffer.from(credential.publicKey).toString('base64url'),
      credential.counter,
      verification.registrationInfo.credentialDeviceType ?? null,
      verification.registrationInfo.credentialBackedUp ? 1 : 0,
      JSON.stringify((body as { response?: { transports?: string[] } }).response?.transports ?? [])
    );

    // Clear challenge cookie
    cookies.delete('__wac', { path: '/' });

    // Issue session
    createSession(cookies);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('register-finish error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
