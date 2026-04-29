import type { APIRoute } from "astro";
import { getAllProjects } from "../lib/db";

export const GET: APIRoute = () => {
  const projects = getAllProjects();
  const published = projects.filter((p) => p.published);

  const current = published.filter((p) => !p.finished);
  const finished = published.filter((p) => p.finished);

  const lines: string[] = [
    "# Fabio Gschweidl",
    "",
    "> Developer and Multimedia professional based in Vienna, Austria, specializing in digital media and web technology.",
    "",
    "Fabio Gschweidl builds web applications and digital experiences with modern technologies",
    "including SvelteKit, Astro, Next.js, TypeScript, Golang, Accessibility and CSS.",
    "",
  ];

  if (current.length > 0) {
    lines.push("## Current Projects", "");
    for (const p of current) {
      const desc = p.description.en?.trim();
      const descSuffix = desc ? `: ${desc}` : "";
      lines.push(
        p.url
          ? `- [${p.title}](${p.url})${descSuffix}`
          : `- ${p.title}${descSuffix}`,
      );
      if (p.categories.length > 0) {
        lines.push(`  Technologies: ${p.categories.join(", ")}`);
      }
    }
    lines.push("");
  }

  if (finished.length > 0) {
    lines.push("## Finished Projects", "");
    for (const p of finished) {
      const desc = p.description.en?.trim();
      const descSuffix = desc ? `: ${desc}` : "";
      lines.push(
        p.url
          ? `- [${p.title}](${p.url})${descSuffix}`
          : `- ${p.title}${descSuffix}`,
      );
      if (p.categories.length > 0) {
        lines.push(`  Technologies: ${p.categories.join(", ")}`);
      }
    }
    lines.push("");
  }

  lines.push(
    "## Contact",
    "",
    "Reach Fabio via the contact form at https://fabio.sh/contact",
    "",
    "## Links",
    "",
    "- [Home](https://fabio.sh)",
    "- [Projects](https://fabio.sh/projects)",
    "- [About](https://fabio.sh/about)",
    "- [Contact](https://fabio.sh/contact)",
    "- [Media Kit](https://fabio.sh/mediakit)",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
