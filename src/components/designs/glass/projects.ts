import { getAllProjects, type Project } from "../../../lib/db";

// Three real projects for the preview bento: published + online with an
// image first, then any published ones, then a static sample so the page
// still renders on an empty database.
const SAMPLE: Project[] = [
  {
    id: "s1",
    title: "fabio.sh",
    description: { en: "Personal site: Astro SSR, plain CSS, SQLite, passkeys, 23 locales." },
    categories: ["Web", "Design"],
    published: true,
    finished: false,
    online: true,
    image: "/meta_pic.png",
    url: "https://fabio.sh",
    languages: [{ lang: "English", flag: "🇺🇸" }],
    createdAt: "",
  },
];

export function previewProjects(): Project[] {
  let all: Project[] = [];
  try {
    all = getAllProjects();
  } catch {
    all = [];
  }
  const pub = all.filter((p) => p.published);
  const withImg = pub.filter((p) => p.online && p.image);
  const rest = pub.filter((p) => !withImg.includes(p));
  const picked = [...withImg, ...rest].slice(0, 3);
  while (picked.length < 3) picked.push({ ...SAMPLE[0], id: `s${picked.length}` });
  return picked;
}
