import type { APIRoute } from "astro";
import content from "../../lib/docs/neta.txt?raw";

export const GET: APIRoute = () => {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
