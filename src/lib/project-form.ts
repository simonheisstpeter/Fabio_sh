import { parseLanguages, type ProjectInput } from "./db";
import { LOCALES } from "../i18n/locales.js";

/**
 * Single source of truth for turning the admin project form into a row.
 * Previously this mapping was duplicated between the create and update routes,
 * so adding a field meant editing both.
 */
export function projectFromForm(form: FormData, id: string): ProjectInput {
  // The admin form renders a textarea per locale. Before normalisation only six
  // were persisted and the rest were silently dropped; now all of them survive.
  const description: Record<string, string> = {};
  for (const locale of LOCALES) {
    const value = String(form.get(`desc_${locale}`) ?? "");
    if (value.trim()) description[locale] = value;
  }

  return {
    id,
    title: String(form.get("title") ?? "").trim(),
    description,
    categories: String(form.get("categories") ?? "")
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean),
    published: Boolean(form.get("published")),
    finished: Boolean(form.get("finished")),
    online: Boolean(form.get("online")),
    image: String(form.get("image") ?? ""),
    url: String(form.get("url") ?? ""),
    languages: parseLanguages(String(form.get("languages") ?? "")),
  };
}

/** `my Project ` -> `my-project` */
export function slugify(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-");
}
