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
export const ATPROTO_PDS = "https://at.fabio.sh";
export const BSKY_PROFILE_URL = `https://bsky.app/profile/${ATPROTO_HANDLE}`;

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
  pdsUrl: string;
};

export type SocialFeed = {
  profile: FeedProfile;
  posts: FeedPost[];
};

const FETCH_TIMEOUT_MS = 6_000;
const CACHE_TTL_MS = 5 * 60_000;
const ERROR_CACHE_TTL_MS = 30_000;

/** listRecords caps at 100. Most records are replies, so over-fetch and filter. */
const RECORD_FETCH_LIMIT = 100;
const MAX_POSTS = 20;

let cache: { feed: SocialFeed | null; expiresAt: number } | null = null;

function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function blobUrl(cid: string): string {
  return `${ATPROTO_PDS}/xrpc/com.atproto.sync.getBlob?did=${ATPROTO_DID}&cid=${cid}`;
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
    pdsUrl: ATPROTO_PDS,
  };
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

export async function getSocialFeed(): Promise<SocialFeed | null> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.feed;

  try {
    const [profile, posts] = await Promise.all([fetchProfile(), fetchPosts()]);
    const feed: SocialFeed = { profile, posts };
    cache = { feed, expiresAt: now + CACHE_TTL_MS };
    return feed;
  } catch (err) {
    console.error("[atproto] getSocialFeed failed:", err instanceof Error ? err.message : err);
    // Short negative cache so a PDS blip doesn't turn into retry spam.
    cache = { feed: null, expiresAt: now + ERROR_CACHE_TTL_MS };
    return null;
  }
}
