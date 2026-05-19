import type { APIRoute } from "astro";
import { deleteSession } from "../../../lib/admin-auth";
import { CV_COOKIE } from "../../../lib/db";

export const GET: APIRoute = () =>
  new Response(null, { status: 302, headers: { Location: "/admin/login" } });

export const POST: APIRoute = ({ cookies }) => {
  deleteSession(cookies);
  cookies.delete(CV_COOKIE, { path: "/" });
  return new Response(null, {
    status: 302,
    headers: { Location: "/admin/login" },
  });
};
