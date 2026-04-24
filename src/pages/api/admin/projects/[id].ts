import type { APIRoute } from 'astro';
import { getDb, parseLanguages, invalidateProjectsCache } from '../../../../lib/db';

async function handlePut(id: string, form: FormData): Promise<Response> {
  const title = String(form.get('title') ?? '').trim();
  if (!title) {
    return new Response(JSON.stringify({ error: 'title is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const categories = (String(form.get('categories') ?? ''))
    .split('\n')
    .map((c) => c.trim())
    .filter(Boolean);

  const languages = parseLanguages(String(form.get('languages') ?? ''));

  const db = getDb();
  const info = db.prepare(
    `UPDATE projects SET
       title = ?, desc_de = ?, desc_en = ?, desc_es = ?, desc_it = ?, desc_ja = ?, desc_pt = ?,
       categories = ?, published = ?, finished = ?, online = ?, image = ?, url = ?, languages = ?
     WHERE id = ?`
  ).run(
    title,
    String(form.get('desc_de') ?? ''),
    String(form.get('desc_en') ?? ''),
    String(form.get('desc_es') ?? ''),
    String(form.get('desc_it') ?? ''),
    String(form.get('desc_ja') ?? ''),
    String(form.get('desc_pt') ?? ''),
    JSON.stringify(categories),
    form.get('published') ? 1 : 0,
    form.get('finished') ? 1 : 0,
    form.get('online') ? 1 : 0,
    String(form.get('image') ?? ''),
    String(form.get('url') ?? ''),
    JSON.stringify(languages),
    id
  );

  if (info.changes === 0) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  invalidateProjectsCache();
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/projects' },
  });
};

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/projects' } });

export const PUT: APIRoute = async ({ request, params }) => {
  return handlePut(params.id!, await request.formData());
};

export const DELETE: APIRoute = ({ params }) => {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(params.id!);
  invalidateProjectsCache();
  return new Response(null, { status: 302, headers: { Location: '/admin/projects' } });
};

// Handle _method override for HTML forms (PUT/DELETE via POST)
export const POST: APIRoute = async ({ request, params }) => {
  const form = await request.formData();
  const method = String(form.get('_method') ?? '').toUpperCase();

  if (method === 'DELETE') {
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(params.id!);
    invalidateProjectsCache();
    return new Response(null, { status: 302, headers: { Location: '/admin/projects' } });
  }
  if (method === 'PUT') {
    return handlePut(params.id!, form);
  }

  return new Response(JSON.stringify({ error: 'Invalid method override' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
