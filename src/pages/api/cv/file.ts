import type { APIRoute } from "astro";
import {
  getCvSecretByValue,
  getCvFileData,
  getCvFile,
  CV_COOKIE,
  CV_LANGS,
  type CvLang,
} from "../../../lib/db";
import { validateSession } from "../../../lib/admin-auth";

export const GET: APIRoute = ({ cookies, url }) => {
  const secret = cookies.get(CV_COOKIE)?.value;
  const authorized =
    validateSession(cookies) || (!!secret && !!getCvSecretByValue(secret));
  if (!authorized) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rawLang = url.searchParams.get("lang") ?? "de";
  const lang: CvLang = (CV_LANGS as readonly string[]).includes(rawLang)
    ? (rawLang as CvLang)
    : "de";

  const data = getCvFileData(lang);
  if (!data) return new Response("Not found", { status: 404 });

  const meta = getCvFile(lang)!;

  return new Response(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(meta.size),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(meta.filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
};
