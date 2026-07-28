/**
 * Bluesky / ATProto feed, read straight from the self-hosted PDS at at.fabio.sh.
 *
 * Deliberately does NOT go through the Bluesky AppView — everything here comes
 * from `com.atproto.repo.*` and `com.atproto.sync.getBlob` on the own PDS, so
 * the page keeps working regardless of Bluesky's infrastructure.
 *
 * Trade-off: like/repost/reply counts are an AppView aggregate and simply do
 * not exist at the PDS level, so they are not displayed.
 */

export const ATPROTO_DID = "did:plc:ip4symhldu6klwmx6c2gso66";
export const ATPROTO_HANDLE = "fabio.sh";
export const BSKY_PROFILE_URL = `https://bsky.app/profile/${ATPROTO_HANDLE}`;

/** Kept module-private: the PDS host is deliberately not surfaced in markup. */
const ATPROTO_PDS = "https://at.fabio.sh";

export type FeedImage = {
  url: string;
  alt: string;
  aspectRatio: { width: number; height: number } | null;
};

export type FeedPost = {
  /** rkey — used as the stable list key and to build the bsky.app permalink */
  rkey: string;
  url: string;
  text: string;
  createdAt: string;
  images: FeedImage[];
};

export type FeedProfile = {
  displayName: string;
  handle: string;
  description: string;
  avatar: string | null;
};

export type AtprotoApp = {
  /** NSID authority, e.g. "sh.tangled" */
  namespace: string;
  /** Friendly name if known, otherwise the derived domain. */
  name: string;
  /** Profile/app link, when one is known. */
  url: string | null;
  /** How many lexicons of this app the repo holds. */
  collections: number;
};

export type SocialFeed = {
  profile: FeedProfile;
  posts: FeedPost[];
  apps: AtprotoApp[];
};

const FETCH_TIMEOUT_MS = 6_000;

/** How long a cached feed is served without any revalidation. */
export const CACHE_TTL_MS = 5 * 60_000;
/** Beyond FRESH, the feed is still served instantly but refreshed in the
 *  background — so a visitor never waits on the PDS just because a TTL rolled
 *  over. Only past this window do we block on a fetch. */
const STALE_TTL_MS = 60 * 60_000;
const ERROR_CACHE_TTL_MS = 30_000;

/** listRecords caps at 100. Most records are replies, so over-fetch and filter. */
const RECORD_FETCH_LIMIT = 100;
const MAX_POSTS = 20;

type CacheEntry = { feed: SocialFeed | null; freshUntil: number; staleUntil: number };
let cache: CacheEntry | null = null;

/** Dedupes concurrent refreshes so a burst of traffic yields one PDS fetch. */
let inFlight: Promise<SocialFeed | null> | null = null;

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Base32 CIDv1. Anchored, so a CID can never smuggle a path or host. */
const CID_RE = /^ba[a-z2-7]{20,78}$/;

/** Same-origin URL — the PDS host stays out of the markup. See /api/blob. */
function blobUrl(cid: string): string {
  return `/api/blob?cid=${encodeURIComponent(cid)}`;
}

/**
 * Streams a blob from the PDS. `cid` is user-controlled (it arrives as a query
 * param), so it is validated against CID_RE and interpolated into a fixed
 * host + path — never used to build an arbitrary URL.
 */
export async function fetchBlob(
  cid: string,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  if (!CID_RE.test(cid)) return null;

  try {
    const res = await fetchWithTimeout(
      `${ATPROTO_PDS}/xrpc/com.atproto.sync.getBlob?did=${ATPROTO_DID}&cid=${cid}`,
    );
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    // Only ever hand back images; the PDS holds other blob types too.
    if (!contentType.startsWith("image/")) return null;

    return { body: await res.arrayBuffer(), contentType };
  } catch (err) {
    console.error("[atproto] fetchBlob failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

type BlobRef = { ref?: { $link?: string } };

function blobCid(blob: unknown): string | null {
  const link = (blob as BlobRef | undefined)?.ref?.$link;
  return typeof link === "string" ? link : null;
}

/** Pulls images out of `embed.images` and the media half of `recordWithMedia`. */
function extractImages(embed: unknown): FeedImage[] {
  const e = embed as { $type?: string; images?: unknown[]; media?: unknown } | undefined;
  if (!e) return [];

  if (e.$type === "app.bsky.embed.recordWithMedia") return extractImages(e.media);
  if (e.$type !== "app.bsky.embed.images" || !Array.isArray(e.images)) return [];

  const out: FeedImage[] = [];
  for (const raw of e.images) {
    const img = raw as { image?: unknown; alt?: string; aspectRatio?: unknown };
    const cid = blobCid(img.image);
    if (!cid) continue;

    const ar = img.aspectRatio as { width?: number; height?: number } | undefined;
    out.push({
      url: blobUrl(cid),
      alt: typeof img.alt === "string" ? img.alt : "",
      aspectRatio:
        ar?.width && ar?.height ? { width: ar.width, height: ar.height } : null,
    });
  }
  return out;
}

async function fetchProfile(): Promise<FeedProfile> {
  const url =
    `${ATPROTO_PDS}/xrpc/com.atproto.repo.getRecord` +
    `?repo=${ATPROTO_DID}&collection=app.bsky.actor.profile&rkey=self`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`getRecord(profile) failed: ${res.status}`);

  const data = (await res.json()) as {
    value?: { displayName?: string; description?: string; avatar?: unknown };
  };
  const v = data.value ?? {};
  const avatarCid = blobCid(v.avatar);

  return {
    displayName: v.displayName ?? ATPROTO_HANDLE,
    handle: ATPROTO_HANDLE,
    description: v.description ?? "",
    avatar: avatarCid ? blobUrl(avatarCid) : null,
  };
}

/**
 * Apps this identity is present on, derived from the lexicons in the repo.
 *
 * An NSID authority is a reversed domain (`sh.tangled` -> tangled.sh), so an
 * unknown app still yields a sensible label without any hardcoding — start
 * using a new atproto app and it shows up here on its own.
 */
const KNOWN_APPS: Record<string, { name: string; profile?: (handle: string) => string; url?: string }> = {
  "app.bsky": { name: "Bluesky", profile: (h) => `https://bsky.app/profile/${h}` },
  "sh.tangled": { name: "Tangled", profile: (h) => `https://tangled.sh/@${h}` },
  "com.luminframe": { name: "Luminframe", url: "https://luminframe.com" },
  "vote.pedro": { name: "Pedro" },
};

/** Protocol plumbing, not an app anyone visits. */
const INFRA_NAMESPACES = new Set(["com.atproto"]);

function namespaceToDomain(ns: string): string {
  return ns.split(".").reverse().join(".");
}

async function fetchApps(): Promise<AtprotoApp[]> {
  const res = await fetchWithTimeout(
    `${ATPROTO_PDS}/xrpc/com.atproto.repo.describeRepo?repo=${ATPROTO_DID}`,
  );
  if (!res.ok) throw new Error(`describeRepo failed: ${res.status}`);

  const data = (await res.json()) as { collections?: string[] };

  // Group lexicons by their authority (first two NSID segments).
  const counts = new Map<string, number>();
  for (const nsid of data.collections ?? []) {
    const parts = nsid.split(".");
    if (parts.length < 3) continue;
    const ns = `${parts[0]}.${parts[1]}`;
    if (INFRA_NAMESPACES.has(ns)) continue;
    counts.set(ns, (counts.get(ns) ?? 0) + 1);
  }

  const apps: AtprotoApp[] = [];
  for (const [namespace, collections] of counts) {
    const known = KNOWN_APPS[namespace];
    apps.push({
      namespace,
      name: known?.name ?? namespaceToDomain(namespace),
      url: known?.profile?.(ATPROTO_HANDLE) ?? known?.url ?? null,
      collections,
    });
  }

  // Busiest app first, then alphabetical for a stable order.
  apps.sort((a, b) => b.collections - a.collections || a.name.localeCompare(b.name));
  return apps;
}

async function fetchPosts(): Promise<FeedPost[]> {
  const url =
    `${ATPROTO_PDS}/xrpc/com.atproto.repo.listRecords` +
    `?repo=${ATPROTO_DID}&collection=app.bsky.feed.post&limit=${RECORD_FETCH_LIMIT}`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`listRecords(posts) failed: ${res.status}`);

  const data = (await res.json()) as {
    records?: Array<{ uri?: string; value?: Record<string, unknown> }>;
  };

  const posts: FeedPost[] = [];
  for (const record of data.records ?? []) {
    const v = record.value;
    if (!v || !record.uri) continue;

    // Replies lack their parent context here, so only show top-level posts.
    if ("reply" in v) continue;

    const rkey = record.uri.split("/").pop();
    if (!rkey) continue;

    posts.push({
      rkey,
      url: `${BSKY_PROFILE_URL}/post/${rkey}`,
      text: typeof v.text === "string" ? v.text : "",
      createdAt: typeof v.createdAt === "string" ? v.createdAt : "",
      images: extractImages(v.embed),
    });
  }

  // listRecords is rkey-ordered (reverse-chronological), but sort defensively.
  posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return posts.slice(0, MAX_POSTS);
}

function refresh(): Promise<SocialFeed | null> {
  // Collapse parallel callers onto one fetch.
  inFlight ??= (async () => {
    try {
      const [profile, posts, apps] = await Promise.all([
        fetchProfile(),
        fetchPosts(),
        fetchApps(),
      ]);
      const feed: SocialFeed = { profile, posts, apps };
      const now = Date.now();
      cache = {
        feed,
        freshUntil: now + CACHE_TTL_MS,
        staleUntil: now + STALE_TTL_MS,
      };
      return feed;
    } catch (err) {
      console.error("[atproto] getSocialFeed failed:", err instanceof Error ? err.message : err);
      const now = Date.now();
      // Keep serving the last good feed if we have one — a PDS blip should not
      // blank the page. Otherwise negative-cache briefly to avoid retry spam.
      if (cache?.feed) {
        cache = { ...cache, freshUntil: now + ERROR_CACHE_TTL_MS };
        return cache.feed;
      }
      cache = {
        feed: null,
        freshUntil: now + ERROR_CACHE_TTL_MS,
        staleUntil: now + ERROR_CACHE_TTL_MS,
      };
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Stale-while-revalidate: fresh hits return immediately, stale hits return the
 * cached feed immediately and refresh in the background, and only a cold or
 * fully-expired cache blocks on the PDS.
 */
export async function getSocialFeed(): Promise<SocialFeed | null> {
  const now = Date.now();

  if (cache) {
    if (now < cache.freshUntil) return cache.feed;

    if (now < cache.staleUntil) {
      // Don't await — the visitor gets the stale copy now.
      void refresh();
      return cache.feed;
    }
  }

  return refresh();
}
