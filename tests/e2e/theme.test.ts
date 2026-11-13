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

  it("renders theme toggle buttons (desktop nav + mobile menu) with a localized label", async () => {
    const html = await (await anon.get("/")).text();
    const toggles = html.match(/data-theme-toggle/g) ?? [];
    expect(toggles.length).toBeGreaterThanOrEqual(2);
    expect(html).toContain('aria-label="Farbschema wechseln"'); // default locale de
  });

  it("renders the hairline viewport frame on every page — no pixel strips or corner blocks", async () => {
    // fresh DB has no admin yet, so /admin/login redirects to /admin/register
    for (const path of ["/", "/projects", "/about", "/contact", "/courses", "/404", "/admin/register"]) {
      const res = await anon.get(path);
      expect([200, 404], path).toContain(res.status); // /404 renders with status 404
      const html = await res.text();
      expect(html, path).toContain('class="page-frame"');
      expect(html, path).not.toContain("edge-strip");
      expect(html, path).not.toContain("pixel-strip");
      expect(html, path).not.toContain("fc fc-");
    }
  });

  it("serves the Andes Neue faces and preloads ExtraLight; pixel fonts are gone", async () => {
    const html = await (await anon.get("/")).text();
    expect(html).toContain("/fonts/AndesNeue-ExtraLight.woff2");
    expect(html).not.toContain("handjet");
    expect(html).not.toContain("silkscreen");
    const font = await anon.get("/fonts/AndesNeue-ExtraLight.woff2");
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
    expect(css).toContain("--ink-rgb:242 242 242");
    expect(css).toContain("--paper:#0a0a0a");
    expect(css).toContain(".page-frame");
    expect(css).toContain(".font-display");
    expect(css).toContain(".h-display");
    expect(css).toContain(".caret");
    expect(css).toContain('"AndesNeueExtraLight"');
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
