import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, startServer, type Server } from "./harness";

let s: Server;
let anon: Client;

beforeAll(async () => {
  s = await startServer();
  anon = new Client(s.url);
});
afterAll(() => s.stop());

describe("dark/light theme system", () => {
  it("declares light+dark color-scheme and ships a pre-paint theme init script", async () => {
    const res = await anon.get("/");
    const html = await res.text();
    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    // inline init script in <head>: sets data-theme from localStorage or
    // prefers-color-scheme before first paint (no theme flash)
    expect(html).toContain('localStorage.getItem("theme")');
    expect(html).toContain("document.documentElement.dataset.theme");
    expect(html).toContain("prefers-color-scheme: dark");
  });

  it("keeps the chosen theme across client-side navigations", async () => {
    // ClientRouter swaps <html> attributes for the incoming page's, which has no
    // data-theme; the head script copies the current theme onto it first.
    const html = await (await anon.get("/")).text();
    expect(html).toContain('"astro:before-swap"');
    expect(html).toContain("e.newDocument.documentElement.dataset.theme = cur");
  });

  it("renders theme toggle buttons (desktop nav + mobile menu) with a localized label", async () => {
    const html = await (await anon.get("/")).text();
    const toggles = html.match(/data-theme-toggle/g) ?? [];
    expect(toggles.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('aria-label="Farbschema wechseln"'); // default locale de
  });

  it("public pages render the v9 glass world; admin keeps the v8 frame — no pixel strips or corner blocks", async () => {
    // v9 "Prism Tile": public layout opts in via data-design="site" and a fixed
    // glowing tile grid; the brutalist page frame is retired there
    for (const path of ["/", "/projects", "/about", "/contact", "/courses", "/404"]) {
      const res = await anon.get(path);
      expect([200, 404], path).toContain(res.status); // /404 renders with status 404
      const html = await res.text();
      expect(html, path).toContain('data-design="site"');
      expect(html, path).toContain("g-world g-world-c");
      expect(html, path).not.toContain('class="page-frame"');
      expect(html, path).not.toContain("edge-strip");
      expect(html, path).not.toContain("pixel-strip");
      expect(html, path).not.toContain("fc fc-");
    }
    // fresh DB has no admin yet, so /admin/login redirects to /admin/register;
    // the admin layout never opts into the public design layer
    const admin = await (await anon.get("/admin/register")).text();
    expect(admin).toContain('class="page-frame"');
    expect(admin).not.toContain('data-design="site"');
  });

  it("the index hero renders variant 7 by default and previews others via ?hero=", async () => {
    const def = await (await anon.get("/")).text();
    expect(def).toContain('class="gh gh-v7"');
    expect(def).toContain('class="gh-veil"');
    expect((await (await anon.get("/?hero=8")).text())).toContain('class="gh gh-v8 gh-v5"');
    const v3 = await (await anon.get("/?hero=3")).text();
    expect(v3).toContain('class="gh gh-v3"');
    const bogus = await (await anon.get("/?hero=99")).text();
    expect(bogus).toContain('class="gh gh-v7"');
  });

  it("preloads exactly the two used Andes Neue faces; pixel fonts are gone", async () => {
    const html = await (await anon.get("/")).text();
    for (const face of ["AndesNeue-Black", "AndesNeue-Book"]) {
      expect(html).toContain(`/fonts/${face}.woff2`);
    }
    // Medium + Light were dropped in the v8 perf pass (Book covers body text);
    // ExtraLight + Bold were never referenced by a family/class and are not shipped
    expect(html).not.toContain("AndesNeue-Medium.woff2");
    expect(html).not.toContain("AndesNeue-Light.woff2");
    expect(html).not.toContain("AndesNeue-ExtraLight.woff2");
    expect(html).not.toContain("AndesNeue-Bold.woff2");
    expect(html).not.toContain("handjet");
    expect(html).not.toContain("silkscreen");
    const font = await anon.get("/fonts/AndesNeue-Book.woff2");
    expect(font.status).toBe(200);
    expect(font.headers.get("content-type")).toContain("font/woff2");
  });

  it("ships dark tokens, the frame and the display type system in the built CSS", async () => {
    const html = await (await anon.get("/")).text();
    const hrefs = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g)].map((m) => m[1]);
    expect(hrefs.length, "stylesheet links in HTML").toBeGreaterThan(0);
    let css = "";
    for (const href of hrefs) css += await (await anon.get(href)).text();
    // built CSS is minified: attribute quotes and spaces after colons are stripped
    expect(css).toContain("html[data-theme=dark]");
    expect(css).toContain("--ink-rgb:230 251 242");
    expect(css).toContain("--paper:#0a1512");
    expect(css).toContain(".page-frame");
    // v9 public design layer: emerald glass tokens for both themes
    expect(css).toContain("html[data-design=site]");
    expect(css).toContain("--paper:#050b09");
    expect(css).toContain("backdrop-filter");
    expect(css).toContain(".font-display");
    expect(css).toContain(".h-display");
    expect(css).toContain(".caret");
    for (const fam of ['"AndesNeueBlack"', '"AndesNeueBook"']) {
      expect(css, fam).toContain(fam);
    }
    expect(css).not.toContain("AndesNeueMedium");
    expect(css).not.toContain("AndesNeueLight");
    expect(css).not.toContain("AndesNeueExtraLight");
    expect(css).not.toContain("AndesNeueBold");
    expect(css).not.toContain("Handjet");
    expect(css).not.toContain("Silkscreen");
    expect(css).not.toContain(".pixel-strip");
    expect(css).not.toContain(".pixel-checker");
    expect(css).not.toContain(".dither-fade");
    // previously-undefined classes used in markup must now exist
    for (const cls of [".sticky", ".bg-paper\\/95", ".md\\:mt-24", ".pb-24", ".w-40", ".translate-y-1\\.5"]) {
      expect(css, cls).toContain(cls);
    }
  });

  it("admin layout follows the same theme system", async () => {
    const res = await anon.get("/admin/register");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<meta[^>]+name="color-scheme"[^>]+content="light dark"[^>]*>/);
    expect(html).toContain("document.documentElement.dataset.theme");
    expect(html).toContain('class="page-frame"');
  });
});
