import type { APIRoute } from "astro";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const GET: APIRoute = () => {
  const content = readFileSync(
    resolve("src/lib/docs/neta.txt"),
    "utf-8"
  );

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
