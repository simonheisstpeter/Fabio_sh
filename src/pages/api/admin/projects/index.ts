import type { APIRoute } from 'astro';
import { getDb, parseLanguages, invalidateProjectsCache } from '../../../../lib/db';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/projects' } });

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();

  const id = String(form.get('id') ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  const title = String(form.get('title') ?? '').trim();

  if (!id || !title) {
    return new Response(JSON.stringify({ error: 'id and title are required' }), {
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
  try {
    db.prepare(
      `INSERT INTO projects
       (id, title, desc_de, desc_en, desc_es, desc_it, desc_ja, desc_pt,
        categories, published, finished, online, image, url, languages)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, title,
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
      JSON.stringify(languages)
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'DB error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  invalidateProjectsCache();
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/projects' },
  });
};
