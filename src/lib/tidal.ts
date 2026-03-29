/**
 * Tidal "last played" integration using unofficial Tidal API.
 * Credentials come from environment variables TIDAL_MAIL and TIDAL_PASSWORD.
 *
 * ⚠️  Uses Tidal's unofficial internal API. May break if Tidal changes endpoints.
 */

export type TidalTrack = {
  title: string;
  artist: string;
  album: string;
  coverUrl: string | null;
  trackUrl: string | null;
};

// 30-second in-memory cache
let cache: { track: TidalTrack | null; expiresAt: number } | null = null;

// Known Tidal web client token (public, used by many unofficial clients)
const TIDAL_TOKEN = 'CzET4vdadNUFQ5JU';
const TIDAL_API = 'https://api.tidal.com/v1';

type TidalSession = { sessionId: string; userId: number; countryCode: string };

const FETCH_TIMEOUT_MS = 5_000;

function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function authenticate(): Promise<TidalSession> {
  const mail = import.meta.env.TIDAL_MAIL ?? process.env.TIDAL_MAIL;
  const password = import.meta.env.TIDAL_PASSWORD ?? process.env.TIDAL_PASSWORD;

  if (!mail || !password) throw new Error('TIDAL_MAIL / TIDAL_PASSWORD not set');

  const res = await fetchWithTimeout(`${TIDAL_API}/login/username?token=${TIDAL_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tidal-Token': TIDAL_TOKEN },
    body: JSON.stringify({ username: mail, password }),
  });

  if (!res.ok) throw new Error(`Tidal auth failed: ${res.status}`);
  return res.json() as Promise<TidalSession>;
}

async function fetchLastPlayed(session: TidalSession): Promise<TidalTrack | null> {
  // Tidal does not have a public "currently playing" endpoint.
  // We fetch recent tracks from the user's playback history.
  const res = await fetchWithTimeout(
    `${TIDAL_API}/users/${session.userId}/playbacksessions?limit=1&countryCode=${session.countryCode}`,
    {
      headers: {
        'X-Tidal-SessionId': session.sessionId,
        'X-Tidal-Token': TIDAL_TOKEN,
      },
    },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as {
    items?: Array<{
      track?: {
        title: string;
        artists: Array<{ name: string }>;
        album: { title: string; cover: string };
        url: string;
      };
    }>;
  };

  const item = data?.items?.[0]?.track;
  if (!item) return null;

  const coverId = item.album?.cover?.replace(/-/g, '/');
  const coverUrl = coverId
    ? `https://resources.tidal.com/images/${coverId}/320x320.jpg`
    : null;

  return {
    title: item.title,
    artist: item.artists?.map((a) => a.name).join(', ') ?? '',
    album: item.album?.title ?? '',
    coverUrl,
    trackUrl: item.url ?? null,
  };
}

export async function getLastPlayed(): Promise<TidalTrack | null> {
  const now = Date.now();

  if (cache && cache.expiresAt > now) return cache.track;

  try {
    const session = await authenticate();
    const track = await fetchLastPlayed(session);
    cache = { track, expiresAt: now + 30_000 };
    return track;
  } catch (err) {
    console.error('[tidal] getLastPlayed failed:', err instanceof Error ? err.message : err);
    // Graceful fallback — cache null for 10 s to avoid retry spam
    cache = { track: null, expiresAt: now + 10_000 };
    return null;
  }
}
