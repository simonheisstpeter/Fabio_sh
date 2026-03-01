import type { APIRoute } from 'astro';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getDb } from '../../../lib/db';

export const POST: APIRoute = async ({ cookies }) => {
  const db = getDb();
  const credentials = db
    .prepare('SELECT credential_id, transports FROM webauthn_credentials')
    .all() as { credential_id: string; transports: string }[];

  if (credentials.length === 0) {
    return new Response(JSON.stringify({ error: 'No passkeys registered' }), { status: 400 });
  }

  const options = await generateAuthenticationOptions({
    rpID: import.meta.env.ADMIN_RP_ID ?? 'localhost',
    userVerification: 'required',
    allowCredentials: credentials.map((c) => ({
      id: c.credential_id,
      transports: JSON.parse(c.transports ?? '[]'),
    })),
  });

  cookies.set('__wac', options.challenge, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 300,
    path: '/',
  });

  return new Response(JSON.stringify(options), {
    headers: { 'Content-Type': 'application/json' },
  });
};
