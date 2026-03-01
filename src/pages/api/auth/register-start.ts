import type { APIRoute } from 'astro';
import {
  generateRegistrationOptions,
  type GenerateRegistrationOptionsOpts,
} from '@simplewebauthn/server';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/register' } });

export const POST: APIRoute = async ({ cookies }) => {
  const db = getDb();
  const existingCredentials = db
    .prepare('SELECT credential_id FROM webauthn_credentials')
    .all() as { credential_id: string }[];

  const opts: GenerateRegistrationOptionsOpts = {
    rpName: import.meta.env.ADMIN_RP_NAME ?? 'fabio.sh admin',
    rpID: import.meta.env.ADMIN_RP_ID ?? 'localhost',
    userName: 'admin',
    userDisplayName: 'Admin',
    attestationType: 'none',
    excludeCredentials: existingCredentials.map((c) => ({
      id: c.credential_id,
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'required',
    },
  };

  const options = await generateRegistrationOptions(opts);

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
