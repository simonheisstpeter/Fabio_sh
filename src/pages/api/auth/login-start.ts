import type { APIRoute } from 'astro';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/login' } });

export const POST: APIRoute = async ({ cookies }) => {
  const db = getDb();
  const count = (db.prepare('SELECT COUNT(*) as n FROM webauthn_credentials').get() as { n: number }).n;

  if (count === 0) {
    return new Response(JSON.stringify({ error: 'No passkeys registered' }), { status: 400 });
  }

  // Omit allowCredentials so the browser surfaces all discoverable passkeys for
  // this rpID. The server verifies the credential is authorized in login-finish.
  const options = await generateAuthenticationOptions({
    rpID: import.meta.env.ADMIN_RP_ID ?? 'localhost',
    userVerification: 'required',
  });

  cookies.set('__wac', options.challenge, {
    httpOnly: true,
    sameSite: 'strict',
    secure: import.meta.env.PROD,
    maxAge: 300,
    path: '/',
  });

  return new Response(JSON.stringify(options), {
    headers: { 'Content-Type': 'application/json' },
  });
};
