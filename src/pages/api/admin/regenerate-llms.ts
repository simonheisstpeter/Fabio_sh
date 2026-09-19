import type { APIRoute } from "astro";
import { invalidateProjectsCache } from "../../../lib/db";
import { redirectTo } from "../../../lib/response";

export const POST: APIRoute = () => {
  invalidateProjectsCache();
  return redirectTo("/admin");
};
