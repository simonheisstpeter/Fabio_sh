import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/submissions' } });

export const DELETE: APIRoute = ({ params }) => {
  const db = getDb();
  db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(params.id!);
  return new Response(null, { status: 204 });
};

export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  if (String(form.get('_method') ?? '').toUpperCase() === 'DELETE') {
    const db = getDb();
    db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(params.id!);
    return new Response(null, { status: 302, headers: { Location: '/admin/submissions' } });
  }
  return new Response(JSON.stringify({ error: 'Invalid method' }), { status: 400 });
};
