import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, PDF, PNG, TEXT, signedInClient, startServer, type Server } from "./harness";

let s: Server;
let admin: Client;
let anon: Client;

beforeAll(async () => {
  s = await startServer();
  admin = await signedInClient(s);
  anon = new Client(s.url);
});
afterAll(() => s.stop());

const err = async (res: Response) => ((await res.json()) as { error: string }).error;

describe("courses", () => {
  const create = (over: Record<string, string | File> = {}) =>
    admin.multipart("/api/admin/courses", { id: "My Course", title: "T1", status: "in_progress", progress: "42", ...over });
  const course = (id = "my-course") =>
    s.sql<{
      id: string; title: string; status: string; progress: number; published: number;
      certificate_name: string; cert_len: number | null; topics: string;
    }>("SELECT id, title, status, progress, published, certificate_name, length(certificate) cert_len, topics FROM courses WHERE id = ?", id)[0];

  it("creates a course, slugifying the id and storing the certificate", async () => {
    const res = await create({ certificate: PNG("proof.png"), topics: "TS\n\n Node ", published: "1" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/courses");
    expect(course()).toMatchObject({
      id: "my-course", title: "T1", status: "in_progress", progress: 42, published: 1,
      certificate_name: "proof.png", cert_len: 11,
    });
    expect(JSON.parse(course().topics)).toEqual(["TS", "Node"]);
  });

  it("clamps out-of-range progress instead of erroring", async () => {
    await create({ id: "clamp", progress: "150" });
    expect(course("clamp").progress).toBe(100);
  });

  it("refuses a duplicate id with a friendly 409 and no SQL leakage", async () => {
    const res = await create();
    expect(res.status).toBe(409);
    const message = await err(res);
    expect(message).toBe('A course with id "my-course" already exists');
    expect(message).not.toMatch(/UNIQUE|constraint|sqlite/i);
  });

  it("validates required fields and status", async () => {
    expect(await err(await create({ id: "", title: "x" }))).toBe("id and title are required");
    expect(await err(await create({ id: "no-title", title: "" }))).toBe("title is required");
    expect(await err(await create({ id: "bad", status: "bogus" }))).toBe("invalid status");
    expect(s.sql("SELECT 1 FROM courses WHERE id IN ('no-title','bad')")).toHaveLength(0);
  });

  it("rejects a certificate that isn't really a PDF/JPG/PNG", async () => {
    const res = await create({ id: "evil", certificate: TEXT("cert.pdf") });
    expect(res.status).toBe(400);
    expect(await err(res)).toMatch(/Unsupported file type/);
    expect(course("evil")).toBeUndefined();
  });

  describe("certificate visibility", () => {
    it("is hidden from the public while the course is unpublished", async () => {
      s.sql("UPDATE courses SET published = 0 WHERE id = 'my-course'");
      const anonRes = await anon.get("/api/courses/my-course/certificate");
      expect(anonRes.status).toBe(404);
      expect(await anonRes.text()).toBe("Not found");
    });

    it("…but the admin can still preview it, uncached", async () => {
      const res = await admin.get("/api/courses/my-course/certificate");
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("image/png");
      expect(res.headers.get("cache-control")).toBe("private, no-store");
      expect(res.headers.get("content-disposition")).toContain("attachment");
      expect(res.headers.get("content-disposition")).toContain("proof.png");
    });

    it("looks identical for a missing course, so ids can't be probed", async () => {
      const missing = await anon.get("/api/courses/nope/certificate");
      const hidden = await anon.get("/api/courses/my-course/certificate");
      expect([missing.status, await missing.text()]).toEqual([hidden.status, await hidden.text()]);
    });

    it("becomes public, and cacheable, once published", async () => {
      s.sql("UPDATE courses SET published = 1 WHERE id = 'my-course'");
      const res = await anon.get("/api/courses/my-course/certificate");
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
    });

    it("404s for a published course that has no certificate", async () => {
      await create({ id: "plain", published: "1" });
      expect((await anon.get("/api/courses/plain/certificate")).status).toBe(404);
    });
  });

  describe("updating", () => {
    const put = (id: string, fields: Record<string, string | File>) =>
      admin.multipart(`/api/admin/courses/${id}`, { _method: "PUT", title: "T1", ...fields });

    it("keeps the stored certificate when no new file arrives", async () => {
      const res = await put("my-course", { status: "completed", progress: "100", published: "1" });
      expect(res.status).toBe(302);
      expect(course()).toMatchObject({ status: "completed", progress: 100, certificate_name: "proof.png", cert_len: 11 });
    });

    it("replaces the certificate when a new one is uploaded", async () => {
      await put("my-course", { certificate: PDF() });
      expect(course()).toMatchObject({ certificate_name: "cv.pdf" });
    });

    it("removes the certificate on request", async () => {
      await put("my-course", { remove_certificate: "1" });
      expect(course()).toMatchObject({ certificate_name: "", cert_len: null });
      expect((await anon.get("/api/courses/my-course/certificate")).status).toBe(404);
    });

    it("rejects a bad status with 400 instead of a database error", async () => {
      const res = await put("my-course", { status: "bogus" });
      expect(res.status).toBe(400);
      expect(await err(res)).toBe("invalid status");
    });

    it("404s for an unknown course instead of pretending to succeed", async () => {
      const res = await put("ghost", {});
      expect(res.status).toBe(404);
      expect(await err(res)).toBe("Course not found");
    });

    it("rejects an unknown method override", async () => {
      const res = await admin.multipart("/api/admin/courses/my-course", { _method: "PATCH" });
      expect(res.status).toBe(400);
    });
  });

  it("deletes a course", async () => {
    const res = await admin.multipart("/api/admin/courses/my-course", { _method: "DELETE" });
    expect(res.status).toBe(302);
    expect(course()).toBeUndefined();
  });
});

describe("CV upload and gated viewing", () => {
  const upload = (fields: Record<string, string | File>) => admin.multipart("/api/admin/cv/upload", fields);

  it("accepts only real PDFs", async () => {
    expect(await err(await upload({ lang: "en", cv: TEXT("cv.pdf") }))).toBe("Unsupported file type (PDF only)");
    expect(await err(await upload({ lang: "en", cv: PNG("cv.pdf") }))).toBe("Unsupported file type (PDF only)");
    expect(s.sql("SELECT 1 FROM cv_files")).toHaveLength(0);
  });

  it("validates language and presence", async () => {
    expect(await err(await upload({ lang: "fr", cv: PDF() }))).toBe("Invalid language");
    expect(await err(await upload({ lang: "en" }))).toBe("No file provided");
  });

  it("stores a PDF per language and replaces on re-upload", async () => {
    expect((await upload({ lang: "en", cv: PDF() })).status).toBe(302);
    const v2 = Buffer.from("%PDF-1.4 second version");
    expect((await upload({ lang: "en", cv: new File([v2], "v2.pdf") })).status).toBe(302);
    expect(s.sql<{ filename: string; size: number }>("SELECT filename, size FROM cv_files WHERE lang='en'")).toEqual([
      { filename: "v2.pdf", size: v2.length },
    ]);
  });

  it("refuses files over the size cap", async () => {
    const big = new File([Buffer.concat([Buffer.from("%PDF"), Buffer.alloc(10 * 1024 * 1024)])], "big.pdf");
    const res = await upload({ lang: "de", cv: big });
    expect(res.status).toBe(400);
    expect(await err(res)).toBe("File too large (max 10 MB)");
  });

  describe("secrets and the viewer cookie", () => {
    const addSecret = (label: string, secret: string) => admin.multipart("/api/admin/cv/secrets", { label, secret });

    it("validates and de-duplicates secrets", async () => {
      expect(await err(await addSecret("", "long-enough-secret"))).toBe("label and secret are required");
      expect(await err(await addSecret("L", "short"))).toBe("secret must be at least 8 characters");
      expect((await addSecret("Recruiter", "open-sesame-1")).status).toBe(302);
      const dup = await addSecret("Other", "open-sesame-1");
      expect(dup.status).toBe(409);
      expect(await err(dup)).toBe("That secret is already in use");
    });

    it("lists secrets to the admin only", async () => {
      const list = (await (await admin.get("/api/admin/cv/secrets")).json()) as { label: string }[];
      expect(list.map((r) => r.label)).toEqual(["Recruiter"]);
      expect((await anon.get("/api/admin/cv/secrets")).status).toBe(401);
    });

    it("a wrong code is refused and sets no cookie", async () => {
      s.clearRateLimits();
      const visitor = new Client(s.url);
      const res = await visitor.form("/api/cv/access", { secret: "guess" });
      expect(res.headers.get("location")).toBe("/cv?error=1");
      expect(visitor.jar.has("cv_secret")).toBe(false);
    });

    it("the file is locked without the cookie", async () => {
      expect((await new Client(s.url).get("/api/cv/file?lang=en")).status).toBe(401);
    });

    it("a correct code grants a session cookie that unlocks the file, uncached", async () => {
      s.clearRateLimits();
      const visitor = new Client(s.url);
      const res = await visitor.form("/api/cv/access", { secret: "  open-sesame-1  " });
      expect(res.headers.get("location")).toBe("/cv");
      const cookie = res.headers.getSetCookie().find((c) => c.startsWith("cv_secret="))!;
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Strict/i);
      expect(cookie).not.toMatch(/Max-Age|Expires/i); // session cookie

      const file = await visitor.get("/api/cv/file?lang=en");
      expect(file.status).toBe(200);
      expect(file.headers.get("content-type")).toBe("application/pdf");
      expect(file.headers.get("cache-control")).toBe("private, no-store");
      expect(file.headers.get("content-disposition")).toContain("v2.pdf");
      expect(Buffer.from(await file.arrayBuffer()).toString().startsWith("%PDF")).toBe(true);

      expect(s.sql("SELECT view_count FROM cv_secrets WHERE secret='open-sesame-1'")[0]).toEqual({ view_count: 1 });
    });

    it("unknown or missing files 404 rather than leaking", async () => {
      s.clearRateLimits();
      const visitor = new Client(s.url);
      await visitor.form("/api/cv/access", { secret: "open-sesame-1" });
      expect((await visitor.get("/api/cv/file?lang=xx")).status).toBe(404); // falls back to "de", which has none
    });

    it("the admin can view the CV without a code", async () => {
      expect((await admin.get("/api/cv/file?lang=en")).status).toBe(200);
    });

    it("throttles code guessing: after 10 tries even the right code is refused", async () => {
      s.clearRateLimits();
      const guesser = new Client(s.url);
      for (let i = 0; i < 10; i++) await guesser.form("/api/cv/access", { secret: `wrong-guess-${i}` });
      const res = await guesser.form("/api/cv/access", { secret: "open-sesame-1" });
      expect(res.headers.get("location")).toBe("/cv?error=1");
      expect(guesser.jar.has("cv_secret")).toBe(false);
    });

    it("guessing can't be sped up by spoofing X-Forwarded-For", async () => {
      s.clearRateLimits();
      const guesser = new Client(s.url);
      for (let i = 0; i < 10; i++) {
        await guesser.form("/api/cv/access", { secret: `x-${i}` }, { "x-forwarded-for": `192.0.2.${i}` });
      }
      const res = await guesser.form("/api/cv/access", { secret: "open-sesame-1" }, { "x-forwarded-for": "192.0.2.200" });
      expect(res.headers.get("location")).toBe("/cv?error=1");
    });

    it("deleting a secret revokes access immediately, despite the lookup cache", async () => {
      s.clearRateLimits();
      const visitor = new Client(s.url);
      await visitor.form("/api/cv/access", { secret: "open-sesame-1" });
      expect((await visitor.get("/api/cv/file?lang=en")).status).toBe(200); // now cached

      const { id } = s.sql<{ id: number }>("SELECT id FROM cv_secrets")[0];
      const del = await admin.fetch(`/api/admin/cv/secrets/${id}`, { method: "DELETE" });
      expect(del.status).toBe(302);

      expect((await visitor.get("/api/cv/file?lang=en")).status).toBe(401);
    });

    it("rejects a non-numeric id on delete", async () => {
      const res = await admin.fetch("/api/admin/cv/secrets/abc", { method: "DELETE" });
      expect(res.status).toBe(400);
    });
  });
});

describe("projects", () => {
  const create = (fields: Record<string, string>) => admin.form("/api/admin/projects", fields);
  const put = (id: string, fields: Record<string, string>) =>
    admin.form(`/api/admin/projects/${id}`, { _method: "PUT", ...fields });
  const children = (id: string) => ({
    tr: s.sql<{ locale: string; description: string }>("SELECT locale, description FROM project_translations WHERE project_id=? ORDER BY locale", id),
    cat: s.sql<{ category: string }>("SELECT category FROM project_categories WHERE project_id=? ORDER BY category", id).map((r) => r.category),
  });

  it("creates a project with translations and categories in one go", async () => {
    const res = await create({
      id: "Demo Proj", title: "Demo", categories: "Web\nAI", languages: "🇩🇪 German",
      desc_de: "Hallo Welt", desc_en: "   ", published: "1",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/projects");
    expect(s.sql("SELECT id, title, published, finished, online FROM projects WHERE id='demo-proj'")).toEqual([
      { id: "demo-proj", title: "Demo", published: 1, finished: 0, online: 0 },
    ]);
    expect(children("demo-proj")).toEqual({ tr: [{ locale: "de", description: "Hallo Welt" }], cat: ["AI", "Web"] });
  });

  it("reports duplicates and missing fields without leaking internals", async () => {
    const dup = await create({ id: "demo-proj", title: "Again" });
    expect(dup.status).toBe(409);
    expect(await err(dup)).toBe('A project with id "demo-proj" already exists');
    expect(await err(await create({ id: "x", title: "" }))).toBe("id and title are required");
    expect(await err(await create({ id: "", title: "x" }))).toBe("id and title are required");
  });

  it("a failed create leaves the existing project untouched (transactional)", async () => {
    await create({ id: "demo-proj", title: "Clobber", desc_de: "changed", categories: "Other" });
    expect(s.sql("SELECT title FROM projects WHERE id='demo-proj'")).toEqual([{ title: "Demo" }]);
    expect(children("demo-proj").tr[0].description).toBe("Hallo Welt");
  });

  it("updates replace translations and categories wholesale", async () => {
    const res = await put("demo-proj", { title: "Renamed", categories: "Only", desc_es: "Hola", finished: "1" });
    expect(res.status).toBe(302);
    expect(s.sql("SELECT title, published, finished FROM projects WHERE id='demo-proj'")).toEqual([
      { title: "Renamed", published: 0, finished: 1 },
    ]);
    expect(children("demo-proj")).toEqual({ tr: [{ locale: "es", description: "Hola" }], cat: ["Only"] });
  });

  it("404s when updating an unknown project, creating nothing", async () => {
    const res = await put("ghost", { title: "Ghost", desc_de: "boo" });
    expect(res.status).toBe(404);
    expect(await err(res)).toBe("Project not found");
    expect(s.sql("SELECT 1 FROM projects WHERE id='ghost'")).toHaveLength(0);
    expect(s.sql("SELECT 1 FROM project_translations WHERE project_id='ghost'")).toHaveLength(0);
  });

  it("requires a title on update", async () => {
    expect((await put("demo-proj", { title: "" })).status).toBe(400);
  });

  it("supports the real PUT and DELETE verbs as well as the form override", async () => {
    const viaVerb = await admin.fetch("/api/admin/projects/demo-proj", {
      method: "PUT",
      body: new URLSearchParams({ title: "Via PUT" }),
    });
    expect(viaVerb.status).toBe(302);
    expect(s.sql("SELECT title FROM projects WHERE id='demo-proj'")).toEqual([{ title: "Via PUT" }]);

    expect((await admin.form("/api/admin/projects/demo-proj", { _method: "PATCH" })).status).toBe(400);
  });

  it("deleting cascades to translations and categories", async () => {
    await put("demo-proj", { title: "T", categories: "Keep", desc_de: "x" });
    const res = await admin.form("/api/admin/projects/demo-proj", { _method: "DELETE" });
    expect(res.status).toBe(302);
    expect(s.sql("SELECT 1 FROM projects WHERE id='demo-proj'")).toHaveLength(0);
    expect(children("demo-proj")).toEqual({ tr: [], cat: [] });
  });

  it("GET on the collection endpoints redirects to the list", async () => {
    for (const path of ["/api/admin/projects", "/api/admin/projects/anything"]) {
      const res = await admin.get(path);
      expect([res.status, res.headers.get("location")]).toEqual([302, "/admin/projects"]);
    }
  });

  it("changes show up on the public page (cache invalidated on write)", async () => {
    await create({ id: "visible", title: "Publicly Visible Thing", published: "1" });
    const html = await (await anon.get("/projects")).text();
    expect(html).toContain("Publicly Visible Thing");
    await admin.form("/api/admin/projects/visible", { _method: "DELETE" });
    expect(await (await anon.get("/projects")).text()).not.toContain("Publicly Visible Thing");
  });
});

describe("admin forms (shared CourseForm / ProjectForm components)", () => {
  it("every admin page renders for a signed-in admin", async () => {
    await admin.multipart("/api/admin/courses", { id: "form-course", title: "Form Course", status: "completed", platform: "Udemy", certificate: PNG("c.png") });
    await admin.form("/api/admin/projects", { id: "form-proj", title: "Form Proj", categories: "Web\nAI", desc_de: "Hallo Welt", published: "1", languages: "🇩🇪 German" });

    for (const path of [
      "/admin", "/admin/projects", "/admin/projects/new", "/admin/projects/form-proj",
      "/admin/courses", "/admin/courses/new", "/admin/courses/form-course", "/admin/cv", "/admin/submissions",
      // A signed-in admin who has no passkey yet may still enrol one from the setup page.
      "/admin/register",
    ]) {
      const res = await admin.get(path);
      expect([path, res.status]).toEqual([path, 200]);
    }
  });

  it("the create forms have an id field and post to the collection", async () => {
    for (const [path, action] of [["/admin/courses/new", "/api/admin/courses"], ["/admin/projects/new", "/api/admin/projects"]]) {
      const html = await (await admin.get(path)).text();
      expect(html, path).toContain('name="id"');
      expect(html, path).toContain(`action="${action}"`);
      expect(html, path).not.toContain('name="_method"');
    }
  });

  it("the edit forms omit the id, tunnel PUT, and prefill values", async () => {
    const course = await (await admin.get("/admin/courses/form-course")).text();
    expect(course).not.toContain('name="id"');
    expect(course).toContain('action="/api/admin/courses/form-course"');
    expect(course).toContain('name="_method" value="PUT"');
    expect(course).toContain('value="Form Course"');
    expect(course).toMatch(/<option value="completed"[^>]*selected/);
    expect(course).toContain("Remove certificate");

    const project = await (await admin.get("/admin/projects/form-proj")).text();
    expect(project).not.toContain('name="id"');
    expect(project).toContain('name="_method" value="PUT"');
    expect(project).toContain('value="Form Proj"');
  });

  it("prefills the checkboxes and selected languages", async () => {
    const html = await (await admin.get("/admin/projects/form-proj")).text();
    expect(html).toMatch(/name="published"[^>]*checked/);
    expect(html).toContain('value="🇩🇪 German"');
  });

  it("does not pad textarea values with whitespace (they used to grow on every save)", async () => {
    const html = await (await admin.get("/admin/projects/form-proj")).text();
    expect(html.match(/<textarea id="desc_de"[^>]*>([\s\S]*?)<\/textarea>/)![1]).toBe("Hallo Welt");
    expect(html.match(/<textarea id="categories"[^>]*>([\s\S]*?)<\/textarea>/)![1]).toBe("AI\nWeb");

    // Round-trip: saving the form as rendered must not change the stored text.
    // (Only the fields under test are posted, so this runs after the checks above.)
    for (let i = 0; i < 3; i++) {
      const page = await (await admin.get("/admin/projects/form-proj")).text();
      const desc = page.match(/<textarea id="desc_de"[^>]*>([\s\S]*?)<\/textarea>/)![1];
      await admin.form("/api/admin/projects/form-proj", { _method: "PUT", title: "Form Proj", desc_de: desc });
    }
    expect(s.sql("SELECT description FROM project_translations WHERE project_id='form-proj' AND locale='de'")).toEqual([
      { description: "Hallo Welt" },
    ]);
  });

  it("unknown ids bounce back to the list", async () => {
    for (const [path, list] of [["/admin/courses/ghost", "/admin/courses"], ["/admin/projects/ghost", "/admin/projects"]]) {
      const res = await admin.get(path);
      expect([res.status, res.headers.get("location")]).toEqual([302, list]);
    }
  });
});

describe("contact submissions admin", () => {
  const seed = (n: number) => {
    s.sql("DELETE FROM contact_submissions");
    for (let i = 0; i < n; i++) {
      s.sql("INSERT INTO contact_submissions (name, email, message, ip_hash) VALUES (?, ?, ?, ?)", `N${i}`, `n${i}@example.com`, `message number ${i}`, "h");
    }
    return s.sql<{ id: number }>("SELECT id FROM contact_submissions ORDER BY id").map((r) => r.id);
  };

  it("lists submissions, masking email addresses and escaping content", async () => {
    s.sql("DELETE FROM contact_submissions");
    s.sql("INSERT INTO contact_submissions (name, email, message) VALUES (?, ?, ?)", "<b>Bob</b>", "bob@example.com", "<script>alert(1)</script> hello there");
    const html = await (await admin.get("/admin/submissions")).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<b>Bob</b>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("bo***@example.com");
  });

  it("deletes via the DELETE verb (204) and via form override (302)", async () => {
    const [a, b] = seed(2);
    expect((await admin.fetch(`/api/admin/submissions/${a}`, { method: "DELETE" })).status).toBe(204);
    const viaForm = await admin.form(`/api/admin/submissions/${b}`, { _method: "DELETE" });
    expect([viaForm.status, viaForm.headers.get("location")]).toEqual([302, "/admin/submissions"]);
    expect(s.sql("SELECT COUNT(*) n FROM contact_submissions")[0]).toEqual({ n: 0 });
  });

  it("rejects an unknown method override and leaves data alone", async () => {
    const [id] = seed(1);
    const res = await admin.form(`/api/admin/submissions/${id}`, { _method: "PUT" });
    expect(res.status).toBe(400);
    expect(s.sql("SELECT COUNT(*) n FROM contact_submissions")[0]).toEqual({ n: 1 });
  });
});

describe("database backup and misc admin endpoints", () => {
  it("db-backup returns a consistent SQLite snapshot to the admin, uncached", async () => {
    const res = await admin.get("/api/admin/db-backup");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/^attachment; filename="fabio-\d{4}-\d{2}-\d{2}\.db"$/);
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const body = Buffer.from(await res.arrayBuffer());
    expect(body.subarray(0, 15).toString()).toBe("SQLite format 3");
    expect(Number(res.headers.get("content-length"))).toBe(body.length);
  });

  it("db-backup is closed to anonymous callers", async () => {
    expect((await anon.get("/api/admin/db-backup")).status).toBe(401);
  });

  it("regenerate-llms invalidates the cache and returns to the dashboard", async () => {
    const res = await admin.fetch("/api/admin/regenerate-llms", { method: "POST" });
    expect([res.status, res.headers.get("location")]).toEqual([302, "/admin"]);
  });
});
