import type { APIRoute } from "astro";
import { ATPROTO_DID } from "../../lib/atproto";

/**
 * ATProto handle verification for @fabio.sh.
 *
 * Redundant with the existing `_atproto.fabio.sh` DNS TXT record — resolvers
 * try DNS first and fall back here, so the handle survives a DNS outage.
 * Must be the bare DID with no trailing newline or markup.
 */
export const GET: APIRoute = () =>
  new Response(ATPROTO_DID, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
