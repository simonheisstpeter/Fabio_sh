import type { APIRoute } from "astro";
import { deleteSession } from "../../../lib/admin-auth";
import { CV_COOKIE } from "../../../lib/db";
import { redirectGet, redirectTo } from "../../../lib/response";

export const GET = redirectGet("/admin/login");

export const POST: APIRoute = ({ cookies }) => {
  deleteSession(cookies);
  cookies.delete(CV_COOKIE, { path: "/" });
  return redirectTo("/admin/login");
};
