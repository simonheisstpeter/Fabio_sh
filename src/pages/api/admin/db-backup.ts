import type { APIRoute } from 'astro';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFileSync, unlinkSync } from 'fs';
import { getDb } from '../../../lib/db';
import { validateSession } from '../../../lib/admin-auth';

export const GET: APIRoute = ({ cookies }) => {
  if (!validateSession(cookies)) {
    return new Response(null, { status: 302, headers: { Location: '/admin/login' } });
  }

  const db = getDb();
  const tmpPath = join(tmpdir(), `fabio-backup-${Date.now()}.db`);

  try {
    db.exec(`VACUUM INTO '${tmpPath}'`);
    const buffer = readFileSync(tmpPath);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="fabio-${date}.db"`,
        'Content-Length': String(buffer.length),
      },
    });
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }
};
