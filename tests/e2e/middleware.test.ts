import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, declaredLength, signedInClient, startServer, type Server } from "./harness";

let s: Server;
let anon: Client;

beforeAll(async () => {
  s = await startServer();
  anon = new Client(s.url);
});
afterAll(() => s.stop());

describe("security headers", () => {
  it("are on every SSR response", async () => {
    const res = await anon.get("/projects");
    expect(res.headers.get("strict-transport-security")).toContain("max-age=31536000");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    const csp = res.headers.get("content-security-policy")!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("also cover error and API responses", async () => {
    for (const path of ["/does-not-exist", "/api/admin/cv/secrets", "/robots.txt"]) {
      const res = await anon.get(path);
      expect(res.headers.get("x-content-type-options"), path).toBe("nosniff");
      expect(res.headers.get("content-security-policy"), path).toContain("default-src 'self'");
    }
  });

  it("only the CV viewer may be framed, and only by the same origin", async () => {
    const admin = await signedInClient(s);
    const pdf = await admin.multipart("/api/admin/cv/upload", {
      lang: "de",
      cv: new File([Buffer.from("%PDF-1.4 x")], "cv.pdf"),
    });
    expect(pdf.status).toBe(302);

    const file = await admin.get("/api/cv/file?lang=de");
    expect(file.status).toBe(200);
    expect(file.headers.get("content-security-policy")).toContain("frame-ancestors 'self'");
    expect(file.headers.get("x-frame-options")).toBe("SAMEORIGIN");
  });
});

describe("CSRF (Origin check on state-changing requests)", () => {
  const post = (origin?: string) =>
    anon.form("/api/contact", { x: "1" }, origin === undefined ? {} : { origin });

  it("blocks a foreign origin", async () => {
    const res = await post("https://evil.example");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Cross-origin request blocked" });
  });

  it("blocks the opaque 'null' origin and garbage", async () => {
    expect((await post("null")).status).toBe(403);
    expect((await post("not a url")).status).toBe(403);
  });

  it("blocks lookalike hosts", async () => {
    expect((await post("https://fabio.sh.evil.example")).status).toBe(403);
    expect((await post("https://evilfabio.sh")).status).toBe(403);
  });

  it("allows the request's own origin", async () => {
    expect((await post(s.url)).status).not.toBe(403);
  });

  it("allows the canonical site origin (TLS-terminating proxy case)", async () => {
    expect((await post("https://fabio.sh")).status).not.toBe(403);
  });

  it("allows non-browser clients that send no Origin", async () => {
    expect((await post()).status).not.toBe(403);
  });

  it("applies to every unsafe method, and runs before authentication", async () => {
    for (const method of ["PUT", "DELETE", "PATCH", "POST"]) {
      const res = await anon.fetch("/api/admin/submissions/1", { method, headers: { origin: "https://evil.example" } });
      expect(res.status, method).toBe(403);
    }
  });

  it("never blocks safe methods", async () => {
    const res = await anon.get("/", { origin: "https://evil.example" });
    expect(res.status).toBe(200);
  });

  it("protects the admin session: a cross-site form post cannot act as the admin", async () => {
    const admin = await signedInClient(s);
    const res = await admin.form(
      "/api/admin/projects",
      { id: "csrf", title: "injected" },
      { origin: "https://evil.example" },
    );
    expect(res.status).toBe(403);
    expect(s.sql("SELECT COUNT(*) n FROM projects WHERE id='csrf'")[0]).toEqual({ n: 0 });
  });
});

describe("request size limits", () => {
  it("rejects a declared oversize body with 413 before any handler runs", async () => {
    const { status, body } = await declaredLength(s.url, "/api/auth/password-login", 13 * 1024 * 1024);
    expect(status).toBe(413);
    expect(JSON.parse(body)).toEqual({ error: "Request too large" });
  });

  it("lets a large-but-legitimate body through to the handler", async () => {
    const res = await anon.form("/api/auth/password-login", { email: "a@b.c", password: "x", pad: "y".repeat(1024 * 1024) });
    expect(res.status).not.toBe(413);
  });
});

describe("admin API gate", () => {
  it("answers 401 JSON (no redirect) for every /api/admin method", async () => {
    for (const [method, path] of [
      ["GET", "/api/admin/cv/secrets"],
      ["POST", "/api/admin/courses"],
      ["POST", "/api/admin/projects"],
      ["DELETE", "/api/admin/projects/x"],
      ["GET", "/api/admin/db-backup"],
      ["POST", "/api/admin/regenerate-llms"],
    ] as const) {
      const res = await anon.fetch(path, { method });
      expect([method, path, res.status]).toEqual([method, path, 401]);
      expect(res.headers.get("content-type")).toContain("application/json");
    }
  });

  it("redirects anonymous browsers away from every admin page", async () => {
    for (const path of ["/admin", "/admin/projects", "/admin/projects/new", "/admin/courses", "/admin/cv", "/admin/submissions"]) {
      const res = await anon.get(path);
      expect([path, res.status, res.headers.get("location")]).toEqual([path, 302, "/admin/login"]);
    }
  });
});

describe("public page caching", () => {
  it.each(["/", "/projects", "/courses", "/contact", "/mediakit", "/en/projects", "/en/"])(
    "%s may be cached briefly by shared caches",
    async (path) => {
      const res = await anon.get(path);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    },
  );

  it.each(["/cv", "/admin/login", "/does-not-exist", "/robots.txt"])(
    "%s is never marked publicly cacheable by the page rule",
    async (path) => {
      const res = await anon.get(path);
      const cc = res.headers.get("cache-control") ?? "";
      expect(cc).not.toContain("stale-while-revalidate");
      expect(cc).not.toContain("s-maxage=60");
    },
  );

  it("never caches an authenticated page publicly", async () => {
    const admin = await signedInClient(s);
    for (const path of ["/admin", "/admin/projects", "/cv"]) {
      const res = await admin.get(path);
      expect(res.headers.get("cache-control") ?? "", path).not.toContain("public");
    }
  });
});

describe("routing and SEO", () => {
  it("serves the health-check target without touching the database", async () => {
    const res = await anon.get("/robots.txt");
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/User-agent/i);
  });

  it("keeps the scratch /test page out of production", async () => {
    expect((await anon.get("/test")).status).toBe(404);
  });

  it("lists hreflang alternates for real languages only, never the en-x-* novelty ones", async () => {
    const html = await (await anon.get("/")).text();
    const langs = [...html.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
    expect(langs).toEqual(expect.arrayContaining(["de", "en", "fr", "ja"]));
    expect(langs.filter((l) => l.startsWith("en-x-"))).toEqual([]);
    expect(new Set(langs).size).toBe(14);
  });

  it("serves the default locale unprefixed and the others prefixed", async () => {
    expect((await anon.get("/projects")).status).toBe(200);
    expect((await anon.get("/en/projects")).status).toBe(200);
    expect((await anon.get("/de/projects")).status).toBe(404);
  });

  it("sitemap.xml excludes novelty locales and gated pages", async () => {
    const xml = await (await anon.get("/sitemap.xml")).text();
    expect(xml).toContain("<loc>https://fabio.sh/projects</loc>");
    expect(xml).not.toContain("en-x-");
    expect(xml).not.toContain("/cv<");
    expect(xml).not.toContain("/test");
  });
});

describe("ATProto blob proxy", () => {
  it("needs a cid", async () => {
    expect((await anon.get("/api/blob")).status).toBe(400);
  });

  it.each(["../../etc/passwd", "http://evil.example/x", "not-a-cid", "bafy%2F..%2Fx"])(
    "refuses a cid that isn't strict base32 (%s)",
    async (cid) => {
      expect((await anon.get(`/api/blob?cid=${cid}`)).status).toBe(404);
    },
  );
});
