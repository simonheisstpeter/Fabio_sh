import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/admin-auth';

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: '/admin/login' } });

export const POST: APIRoute = ({ cookies }) => {
  deleteSession(cookies);
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/login' },
  });
};
