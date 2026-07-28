import type { APIRoute } from "astro";
import { fetchBlob } from "../../lib/atproto";

/**
 * GET /api/blob?cid=<cid>
 *
 * Same-origin proxy for ATProto blobs (avatars, post images).
 *
 * Exists so the PDS hostname never appears in page markup or in the CSP
 * `img-src` list — `img-src 'self'` covers these images as-is. Also lets us
 * cache aggressively, which the PDS itself does not do.
 */
export const GET: APIRoute = async ({ url }) => {
  const cid = url.searchParams.get("cid");
  if (!cid) return new Response("Missing cid", { status: 400 });

  const blob = await fetchBlob(cid);
  if (!blob) return new Response("Not found", { status: 404 });

  return new Response(blob.body, {
    headers: {
      "Content-Type": blob.contentType,
      // Blobs are content-addressed, so a given CID is immutable forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
