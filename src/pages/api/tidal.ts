import type { APIRoute } from 'astro';
import { getLastPlayed } from '../../lib/tidal';

/**
 * GET /api/tidal
 * Returns the last-played Tidal track (or null) as JSON.
 * 30-second in-memory cache in tidal.ts.
 */
export const GET: APIRoute = async () => {
  try {
    const track = await getLastPlayed();
    return new Response(JSON.stringify({ track }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    });
  } catch {
    return new Response(JSON.stringify({ track: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
