import { describe, expect, it } from "vitest";
import { projectFromForm, slugify } from "../../src/lib/project-form";
import { parseLanguages } from "../../src/lib/db";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

describe("slugify", () => {
  it("lower-cases, trims and hyphenates whitespace", () => {
    expect(slugify("  My Cool   Project ")).toBe("my-cool-project");
    expect(slugify("")).toBe("");
  });
});

describe("parseLanguages", () => {
  it("splits flag from name on the first space", () => {
    expect(parseLanguages("🇩🇪 German\n🇬🇧 British English")).toEqual([
      { flag: "🇩🇪", lang: "German" },
      { flag: "🇬🇧", lang: "British English" },
    ]);
  });

  it("tolerates missing flags and blank lines", () => {
    expect(parseLanguages("\n  \nplain\n")).toEqual([{ flag: "", lang: "plain" }]);
  });
});

describe("projectFromForm", () => {
  it("maps fields, trims the title and reads the boolean flags", () => {
    const input = projectFromForm(
      form({ title: "  T ", image: "/i.png", url: "https://x", published: "1", online: "1" }),
      "my-id",
    );
    expect(input).toMatchObject({
      id: "my-id",
      title: "T",
      image: "/i.png",
      url: "https://x",
      published: true,
      finished: false,
      online: true,
    });
  });

  it("keeps descriptions only for real locales and drops blank ones", () => {
    const input = projectFromForm(
      form({ title: "t", desc_de: "Hallo", desc_en: "   ", desc_xx: "unknown locale" }),
      "id",
    );
    expect(input.description).toEqual({ de: "Hallo" });
  });

  it("splits categories on lines and parses languages", () => {
    const input = projectFromForm(
      form({ title: "t", categories: "Web\n\n AI \n", languages: "🇩🇪 German" }),
      "id",
    );
    expect(input.categories).toEqual(["Web", "AI"]);
    expect(input.languages).toEqual([{ flag: "🇩🇪", lang: "German" }]);
  });
});
