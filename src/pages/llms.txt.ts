import type { APIRoute } from "astro";
import { getAllProjects } from "../lib/db";
import { ATPROTO_DID, ATPROTO_HANDLE, BSKY_PROFILE_URL } from "../lib/atproto";

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
      lines.push(p.url ? `- [${p.title}](${p.url})${descSuffix}` : `- ${p.title}${descSuffix}`);
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
      lines.push(p.url ? `- [${p.title}](${p.url})${descSuffix}` : `- ${p.title}${descSuffix}`);
      if (p.categories.length > 0) {
        lines.push(`  Technologies: ${p.categories.join(", ")}`);
      }
    }
    lines.push("");
  }

  lines.push(
    "## Social / AT Protocol",
    "",
    `Fabio is on the AT Protocol as @${ATPROTO_HANDLE} (${ATPROTO_DID}), running a`,
    "self-hosted Personal Data Server. The feed at https://fabio.sh/social is read",
    "directly from that server rather than through the Bluesky AppView.",
    "",
    `- [Bluesky profile](${BSKY_PROFILE_URL})`,
    "- [Tangled profile](https://tangled.sh/@fabio.sh)",
    "",
    "## Contact",
    "",
    "Reach Fabio via the contact form at https://fabio.sh/contact",
    "",
    "## Links",
    "",
    "- [Home](https://fabio.sh)",
    "- [Projects](https://fabio.sh/projects)",
    "- [About](https://fabio.sh/about)",
    "- [Social](https://fabio.sh/social)",
    "- [Courses](https://fabio.sh/courses)",
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
