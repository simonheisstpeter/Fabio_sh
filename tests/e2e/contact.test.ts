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
    expect(await rejected({ name: "A" })).toEqual({ status: 422, body: { error: "Name must be 2–100 characters" } });
    expect((await rejected({ name: "x".repeat(101) })).status).toBe(422);
  });

  it.each(["", "nope", "a@b", "a b@c.de", "@x.de", "a@b.c"])("rejects email %j", async (email) => {
    expect(await rejected({ email })).toEqual({ status: 422, body: { error: "Please enter a valid email address" } });
  });

  it("message must be 10–2000 characters", async () => {
    expect(await rejected({ message: "too short" })).toEqual({
      status: 422,
      body: { error: "Message must be 10–2000 characters" },
    });
    expect((await rejected({ message: "x".repeat(2001) })).status).toBe(422);
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
