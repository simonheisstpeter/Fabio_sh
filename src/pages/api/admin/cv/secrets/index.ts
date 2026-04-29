import type { APIRoute } from 'astro';
import { getDb, getCvSecrets } from '../../../../../lib/db';
import { jsonError, jsonOk } from '../../../../../lib/response';

export const GET: APIRoute = () => jsonOk(getCvSecrets());

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const label = String(form.get('label') ?? '').trim();
  const secret = String(form.get('secret') ?? '').trim();

  if (!label || !secret) return jsonError('label and secret are required', 400);
  if (secret.length < 8) return jsonError('secret must be at least 8 characters', 400);

  try {
    getDb().prepare('INSERT INTO cv_secrets (label, secret) VALUES (?, ?)').run(label, secret);
  } catch (err: unknown) {
    return jsonError(err instanceof Error ? err.message : 'DB error', 409);
  }

  return redirect('/admin/cv');
};
