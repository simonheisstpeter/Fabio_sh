import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Client, declaredLength, startServer, type Server } from "./harness";

let s: Server;

beforeAll(async () => {
  s = await startServer();
});
afterAll(() => s.stop());
beforeEach(() => {
  s.clearRateLimits();
  s.sql("DELETE FROM contact_submissions");
});

const aged = () => String(Date.now() - 10_000);
const valid = (over: Record<string, string> = {}) => ({
  name: "Tester",
  email: "tester@example.com",
  message: "Hello, this is a perfectly fine message.",
  _t: aged(),
  ...over,
});
const submit = (fields: Record<string, string>, headers: Record<string, string> = {}, client = new Client(s.url)) =>
  client.form("/api/contact", fields, headers);
const stored = () => s.sql<{ name: string; email: string; message: string; ip_hash: string }>(
  "SELECT name, email, message, ip_hash FROM contact_submissions",
);

describe("POST /api/contact — accepting", () => {
  it("stores a valid submission and answers JSON to JS clients", async () => {
    const res = await submit(valid(), { accept: "application/json" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(stored()).toMatchObject([{ name: "Tester", email: "tester@example.com" }]);
  });

  it("trims whitespace around fields", async () => {
    await submit(valid({ name: "  Tester  ", email: "  tester@example.com ", message: "  long enough message  " }), {
      accept: "application/json",
    });
    expect(stored()[0]).toMatchObject({ name: "Tester", email: "tester@example.com", message: "long enough message" });
  });

  it("stores only a keyed hash of the client, never the IP", async () => {
    await submit(valid(), { accept: "application/json" });
    const { ip_hash } = stored()[0];
    expect(ip_hash).toMatch(/^contact:[0-9a-f]{64}$/);
    expect(ip_hash).not.toContain("127.0.0.1");
  });

  it("stores hostile text verbatim (escaping is the renderer's job)", async () => {
    const message = `<img src=x onerror=alert(1)> ${"'; DROP TABLE contact_submissions;--"}`;
    await submit(valid({ message }), { accept: "application/json" });
    expect(stored()[0].message).toBe(message);
    expect(s.sql("SELECT COUNT(*) n FROM contact_submissions")[0]).toEqual({ n: 1 });
  });
});

describe("POST /api/contact — validation", () => {
  const rejected = async (over: Record<string, string>) => {
    const res = await submit(valid(over), { accept: "application/json" });
    expect(stored()).toHaveLength(0);
    return { status: res.status, body: (await res.json()) as { error: string } };
  };

  it("name must be 2–100 characters", async () => {
    expect(await rejected({ name: "A" })).toEqual({
      status: 422,
      body: { error: "Name must be 2–100 characters", field: "name" },
    });
    expect((await rejected({ name: "x".repeat(101) })).status).toBe(422);
  });

  it.each(["", "nope", "a@b", "a b@c.de", "@x.de", "a@b.c"])("rejects email %j", async (email) => {
    expect(await rejected({ email })).toEqual({ status: 422, body: { error: "Please enter a valid email address", field: "email" },
    });
  });

  it("message must be 10–2000 characters", async () => {
    expect(await rejected({ message: "too short" })).toEqual({
      status: 422,
      body: { error: "Message must be 10–2000 characters", field: "message" },
    });
    expect((await rejected({ message: "x".repeat(2001) })).status).toBe(422);
  });

  it("names the first offending field so the browser can show its own localized message", async () => {
    const both = await submit(valid({ name: "", message: "short" }), { accept: "application/json" });
    expect(await both.json()).toMatchObject({ field: "name" });
    const onlyMessage = await submit(valid({ message: "short" }), { accept: "application/json" });
    expect(await onlyMessage.json()).toMatchObject({ field: "message" });
  });

  it("accepts the boundaries", async () => {
    const boundaries: Record<string, string>[] = [
      { name: "Ab" },
      { name: "x".repeat(100) },
      { message: "x".repeat(10) },
      { message: "x".repeat(1900) },
    ];
    for (const over of boundaries) {
      s.clearRateLimits();
      expect((await submit(valid(over), { accept: "application/json" })).status).toBe(200);
    }
    expect(stored()).toHaveLength(4);
  });
});

describe("POST /api/contact — bot defences", () => {
  it("silently swallows honeypot hits (looks like success, stores nothing)", async () => {
    const res = await submit(valid({ website: "http://spam.example" }), { accept: "application/json" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(stored()).toHaveLength(0);
  });

  it("silently swallows submissions that arrive too fast, or with no timestamp", async () => {
    for (const _t of [String(Date.now()), "", "garbage"]) {
      const res = await submit(valid({ _t }), { accept: "application/json" });
      expect(res.status).toBe(200);
    }
    expect(stored()).toHaveLength(0);
  });

  it("allows three submissions per client per hour, then answers 429", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await submit(valid(), { accept: "application/json" })).status);
    expect(statuses).toEqual([200, 200, 200, 429, 429]);
    expect(stored()).toHaveLength(3);
  });

  it("does not let a spoofed X-Forwarded-For buy extra submissions", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) {
      statuses.push(
        (await submit(valid(), { accept: "application/json", "x-forwarded-for": `203.0.113.${i}` })).status,
      );
    }
    expect(statuses.slice(3)).toEqual([429, 429]);
    expect(stored()).toHaveLength(3);
  });

  it("counts honeypot/fast hits against nothing (they never reach the limiter)", async () => {
    for (let i = 0; i < 5; i++) await submit(valid({ website: "x" }), { accept: "application/json" });
    expect((await submit(valid(), { accept: "application/json" })).status).toBe(200);
  });
});

describe("POST /api/contact — body handling", () => {
  it("refuses a declared body over 16 KB with 413", async () => {
    const { status } = await declaredLength(s.url, "/api/contact", 20_000);
    expect(status).toBe(413);
  });

  it("answers 422 for a body that isn't a form", async () => {
    const res = await new Client(s.url).fetch("/api/contact", {
      method: "POST",
      body: "{not a form",
      headers: { "content-type": "application/json", accept: "application/json" },
    });
    expect(res.status).toBe(422);
  });
});

describe("POST /api/contact — no-JS redirect", () => {
  const redirectFor = async (referer?: string) => {
    const res = await submit(valid(), referer === undefined ? {} : { referer });
    expect(res.status).toBe(303);
    return res.headers.get("location");
  };

  it("sends the visitor back to the page they came from with ?sent=1", async () => {
    expect(await redirectFor(`${s.url}/en/contact`)).toBe("/en/contact?sent=1");
  });

  it("keeps existing query parameters", async () => {
    s.clearRateLimits();
    expect(await redirectFor(`${s.url}/contact?ref=mail`)).toBe("/contact?ref=mail&sent=1");
  });

  it("falls back to the home-page form without a Referer", async () => {
    expect(await redirectFor()).toBe("/#contact");
  });

  it("is not an open redirect: foreign referers are ignored", async () => {
    expect(await redirectFor("https://evil.example/phish")).toBe("/#contact");
  });

  it("is not an open redirect: protocol-relative paths are ignored", async () => {
    s.clearRateLimits();
    expect(await redirectFor(`${s.url}//evil.example/x`)).toBe("/#contact");
    s.clearRateLimits();
    expect(await redirectFor("https://evil.example//evil.example/x")).toBe("/#contact");
  });

  it("survives an unparsable Referer", async () => {
    expect(await redirectFor("http://[bad")).toBe("/#contact");
  });

  it("GET just bounces to the form", async () => {
    const res = await new Client(s.url).get("/api/contact");
    expect([res.status, res.headers.get("location")]).toEqual([302, "/#contact"]);
  });
});

describe("the rendered form (hooks the browser script depends on)", () => {
  const page = async (path: string) => {
    const { JSDOM } = await import("jsdom");
    const html = await (await new Client(s.url).get(path)).text();
    return new JSDOM(html).window.document;
  };

  it.each(["/contact", "/en/contact", "/"])("%s exposes every hook initContactForm uses", async (path) => {
    const doc = await page(path);
    const form = doc.querySelector<HTMLFormElement>("#contact-form")!;
    expect(form).not.toBeNull();
    for (const f of ["name", "email", "message"]) {
      expect(form.querySelector(`[data-error-for="${f}"]`), f).not.toBeNull();
      expect(form.elements.namedItem(f), f).not.toBeNull();
    }
    for (const sel of ["[data-counter]", "[data-feedback]", 'input[name="_t"]', 'input[name="website"]', "button[type=submit]"]) {
      expect(form.querySelector(sel), sel).not.toBeNull();
    }
  });

  it("leaves native validation on for visitors without JS, and mirrors the server's limits", async () => {
    const form = (await page("/contact")).querySelector<HTMLFormElement>("#contact-form")!;
    expect(form.hasAttribute("novalidate")).toBe(false);
    const attr = (name: string, a: string) => form.querySelector(`[name="${name}"]`)!.getAttribute(a);
    expect([attr("name", "minlength"), attr("name", "maxlength")]).toEqual(["2", "100"]);
    expect(attr("email", "maxlength")).toBe("254");
    expect([attr("message", "minlength"), attr("message", "maxlength")]).toEqual(["10", "2000"]);
    expect(form.querySelector('[name="email"]')!.getAttribute("type")).toBe("email");
    expect(form.querySelectorAll("[required]")).toHaveLength(3);
  });

  it("renders the validation messages in the page's language", async () => {
    const de = (await page("/contact")).querySelector<HTMLFormElement>("#contact-form")!;
    expect(de.dataset.errName).toBe("Bitte gib deinen Namen ein (2–100 Zeichen).");
    expect(de.dataset.errEmail).toBe("Bitte gib eine gültige E-Mail-Adresse ein.");
    expect(de.dataset.errMessage).toBe("Deine Nachricht muss zwischen 10 und 2000 Zeichen lang sein.");
    expect(de.dataset.errRate).toBeTruthy();
    expect(de.dataset.sending).toBe("Wird gesendet…");

    const en = (await page("/en/contact")).querySelector<HTMLFormElement>("#contact-form")!;
    expect(en.dataset.errName).toBe("Please enter your name (2–100 characters).");
    expect(en.dataset.errMessage).toBe("Your message must be between 10 and 2000 characters.");
  });

  it("ships the script that binds the form on every page view (View Transitions)", async () => {
    const html = await (await new Client(s.url).get("/contact")).text();
    const scripts = [...html.matchAll(/src="(\/_astro\/[^"]*ContactForm[^"]*\.js)"/g)].map((m) => m[1]);
    expect(scripts.length).toBeGreaterThan(0);
    const bundle = await (await new Client(s.url).get(scripts[0])).text();
    expect(bundle).toContain("astro:page-load");
  });
});
