import type { APIRoute } from "astro";
import { invalidateProjectsCache } from "../../../lib/db";

export const POST: APIRoute = () => {
  invalidateProjectsCache();
  return new Response(null, {
    status: 302,
    headers: { Location: "/admin" },
  });
};
