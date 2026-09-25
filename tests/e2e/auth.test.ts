import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, EMAIL, PASSWORD, startServer, type Server } from "./harness";

let s: Server;
let admin: Client;

beforeAll(async () => {
  s = await startServer();
});
afterAll(() => s.stop());

// These run in order: each step builds on the state left by the one before.
describe("admin enrolment and session lifecycle", () => {
  it("sends visitors to setup while no credential exists", async () => {
    const res = await new Client(s.url).get("/admin/login");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/register");
  });

  it("login-start refuses when there is no passkey to sign in with", async () => {
    const res = await new Client(s.url).fetch("/api/auth/login-start", { method: "POST" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No passkeys registered" });
  });

  it("validates the first-run password form", async () => {
    const c = new Client(s.url);
    const post = (fields: Record<string, string>) => c.form("/api/auth/setup-password", fields);

    expect((await post({ email: "", password: "" })).headers.get("location")).toBe("/admin/register?error=missing");
    expect(
      (await post({ email: EMAIL, password: "a-long-password-1", confirm_password: "different-long-2" })).headers.get(
        "location",
      ),
    ).toBe("/admin/register?error=mismatch");
    expect(
      (await post({ email: EMAIL, password: "short", confirm_password: "short" })).headers.get("location"),
    ).toBe("/admin/register?error=short");

    expect(c.jar.has("admin_session")).toBe(false);
    expect(s.sql("SELECT COUNT(*) n FROM admin_password")[0]).toEqual({ n: 0 });
  });

  it("first-run setup creates the admin and signs them in", async () => {
    admin = new Client(s.url);
    const res = await admin.form("/api/auth/setup-password", {
      email: EMAIL,
      password: PASSWORD,
      confirm_password: PASSWORD,
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/register?pw=set");
    expect(admin.jar.has("admin_session")).toBe(true);

    const [row] = s.sql<{ email: string; hash: string }>("SELECT email, hash FROM admin_password");
    expect(row.email).toBe(EMAIL);
    expect(row.hash).toMatch(/^scrypt:[0-9a-f]+:[0-9a-f]+$/);
    expect(row.hash).not.toContain(PASSWORD);
  });

  it("session cookie is HttpOnly + SameSite=Strict and only its digest is stored", async () => {
    const probe = new Client(s.url);
    await probe.form("/api/auth/password-login", { email: EMAIL, password: PASSWORD });
    const token = probe.jar.get("admin_session")!;

    const rows = s.sql<{ token: string }>("SELECT token FROM admin_sessions");
    const digests = rows.map((r) => r.token);
    expect(digests).toContain(createHash("sha256").update(token).digest("hex"));
    expect(digests).not.toContain(token);

    const raw = (await new Client(s.url).form("/api/auth/password-login", { email: EMAIL, password: PASSWORD })).headers
      .getSetCookie()
      .find((c) => c.startsWith("admin_session="))!;
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Strict/i);
    expect(raw).toMatch(/Path=\//);
    expect(raw).toMatch(/Max-Age=604800/);
  });

  it("anonymous visitors can no longer enrol a credential (the takeover hole)", async () => {
    const anon = new Client(s.url);

    expect((await anon.fetch("/api/auth/register-start", { method: "POST" })).status).toBe(401);
    expect((await anon.json("/api/auth/register-finish", {})).status).toBe(401);

    const pw = await anon.form("/api/auth/setup-password", {
      email: "attacker@example.com",
      password: "attacker-password-123",
      confirm_password: "attacker-password-123",
    });
    expect(pw.headers.get("location")).toBe("/admin/login");

    expect(anon.jar.has("admin_session")).toBe(false);
    expect(s.sql("SELECT email FROM admin_password")).toEqual([{ email: EMAIL }]);
    expect(s.sql("SELECT COUNT(*) n FROM webauthn_credentials")[0]).toEqual({ n: 0 });
  });

  it("the setup page bounces anonymous visitors to login once configured", async () => {
    const res = await new Client(s.url).get("/admin/register");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/login");
  });

  it("a signed-in admin may enrol, and the challenge is server-side and single-use", async () => {
    const start = await admin.fetch("/api/auth/register-start", { method: "POST" });
    expect(start.status).toBe(200);
    const options = (await start.json()) as { challenge: string };
    expect(options.challenge).toBeTruthy();

    const wac = admin.jar.get("__wac")!;
    expect(wac).toBeTruthy();
    expect(wac).not.toBe(options.challenge); // cookie is only an opaque id
    expect(s.sql<{ challenge: string }>("SELECT challenge FROM auth_challenges")[0].challenge).toBe(options.challenge);

    // A forged/garbage response fails verification (client error, not a 500)…
    const first = await admin.json("/api/auth/register-finish", { id: "x" });
    expect(first.status).toBe(400);
    expect(await first.json()).toEqual({ error: "Verification failed" });

    // …and the challenge is burned: replaying the same cookie finds nothing.
    const replay = await admin.json("/api/auth/register-finish", { id: "x" }, { cookie: `${admin.cookieHeader()}; __wac=${wac}` });
    expect(replay.status).toBe(400);
    expect(await replay.json()).toEqual({ error: "No challenge found" });
    expect(s.sql("SELECT COUNT(*) n FROM auth_challenges")[0]).toEqual({ n: 0 });
  });

  it("login-finish without a challenge is refused", async () => {
    const res = await new Client(s.url).json("/api/auth/login-finish", { id: "whatever" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No challenge found" });
  });

  it("guards the admin API and admin pages behind the session", async () => {
    const anon = new Client(s.url);

    const api = await anon.get("/api/admin/cv/secrets");
    expect(api.status).toBe(401);
    expect(await api.json()).toEqual({ error: "Unauthorized" });

    const page = await anon.get("/admin");
    expect(page.status).toBe(302);
    expect(page.headers.get("location")).toBe("/admin/login");

    expect((await admin.get("/api/admin/cv/secrets")).status).toBe(200);
    expect((await admin.get("/admin")).status).toBe(200);
  });

  it("a signed-in admin visiting the login page goes straight to the dashboard", async () => {
    const res = await admin.get("/admin/login");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin");
  });
});

describe("password login", () => {
  const attempt = (c: Client, password: string, extra: Record<string, string> = {}, headers = {}) =>
    c.form("/api/auth/password-login", { email: EMAIL, password, ...extra }, headers);

  it("rejects a wrong password and a wrong email with the same generic error", async () => {
    s.clearRateLimits();
    const wrongPw = await attempt(new Client(s.url), "not-the-password");
    const wrongMail = await new Client(s.url).form("/api/auth/password-login", {
      email: "someone@else.com",
      password: PASSWORD,
    });
    expect(wrongPw.status).toBe(401);
    expect(wrongMail.status).toBe(401);
    expect(await wrongPw.json()).toEqual(await wrongMail.json());
  });

  it("requires both fields and caps the password length", async () => {
    s.clearRateLimits();
    const c = new Client(s.url);
    expect((await c.form("/api/auth/password-login", { email: "", password: "" })).status).toBe(400);
    expect((await attempt(c, "x".repeat(2000))).status).toBe(400);
  });

  it("locks out after five failures with a 429", async () => {
    s.clearRateLimits();
    const c = new Client(s.url);
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) statuses.push((await attempt(c, "wrong-password-x")).status);
    expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);

    // Even the right password is refused while locked out.
    expect((await attempt(c, PASSWORD)).status).toBe(429);
    expect(c.jar.has("admin_session")).toBe(false);
  });

  it("a successful login signs in and clears the counter", async () => {
    s.clearRateLimits();
    const c = new Client(s.url);
    await attempt(c, "wrong-1");
    await attempt(c, "wrong-2");
    expect(s.sql("SELECT COUNT(*) n FROM rate_limits WHERE ip_hash LIKE 'login:%'")[0]).toEqual({ n: 1 });

    const ok = await attempt(c, PASSWORD);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true });
    expect(c.jar.has("admin_session")).toBe(true);
    expect(s.sql("SELECT COUNT(*) n FROM rate_limits WHERE ip_hash LIKE 'login:%'")[0]).toEqual({ n: 0 });
    expect((await c.get("/api/admin/cv/secrets")).status).toBe(200);
  });

  it("silently ignores honeypot and too-fast submissions without signing in", async () => {
    s.clearRateLimits();
    const c = new Client(s.url);
    expect((await attempt(c, PASSWORD, { website: "http://spam" })).status).toBe(200);
    expect((await attempt(c, PASSWORD, { _t: String(Date.now()) })).status).toBe(200);
    expect(c.jar.has("admin_session")).toBe(false);
  });

  it("a spoofed X-Forwarded-For cannot dodge the lockout", async () => {
    s.clearRateLimits();
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await attempt(new Client(s.url), "wrong-password-x", {}, { "x-forwarded-for": `198.51.100.${i}` });
      statuses.push(res.status);
    }
    expect(statuses[5]).toBe(429);
  });

  it("behind the real host (validated), each client IP gets its own bucket", async () => {
    s.clearRateLimits();
    // The proxy identifies the site via X-Forwarded-Host; allowedDomains then
    // lets Astro trust X-Forwarded-For, so distinct clients don't share a lockout.
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await attempt(
        new Client(s.url),
        "wrong-password-x",
        {},
        { "x-forwarded-host": "fabio.sh", "x-forwarded-for": `198.51.100.${i}` },
      );
      statuses.push(res.status);
    }
    expect(statuses).toEqual([401, 401, 401, 401, 401, 401]);
  });

  it("logout ends the session server-side, not just in the browser", async () => {
    s.clearRateLimits();
    const c = new Client(s.url);
    await attempt(c, PASSWORD);
    const stolen = c.cookieHeader();
    expect((await new Client(s.url).get("/api/admin/cv/secrets", { cookie: stolen })).status).toBe(200);

    const out = await c.fetch("/api/auth/logout", { method: "POST" });
    expect(out.status).toBe(302);
    expect(out.headers.get("location")).toBe("/admin/login");
    expect(c.jar.has("admin_session")).toBe(false);

    // The captured cookie is dead too.
    expect((await new Client(s.url).get("/api/admin/cv/secrets", { cookie: stolen })).status).toBe(401);
  });

  it("GET on the POST-only auth endpoints just redirects", async () => {
    const c = new Client(s.url);
    for (const path of ["login-start", "login-finish", "password-login", "logout"]) {
      const res = await c.get(`/api/auth/${path}`);
      expect([res.status, res.headers.get("location")]).toEqual([302, "/admin/login"]);
    }
    for (const path of ["register-start", "register-finish", "setup-password"]) {
      const res = await c.get(`/api/auth/${path}`);
      expect([res.status, res.headers.get("location")]).toEqual([302, "/admin/register"]);
    }
  });
});

describe("bootstrap-enrolment race", () => {
  // A dedicated, fresh server: the shared `s` above already has an admin by
  // this point in the file, so the zero-credential bootstrap window it's
  // gone. Regression guard for the canEnrolCredential TOCTOU: two concurrent
  // first-run submissions must not both create an admin.
  it("only one of two concurrent first-run password setups wins", async () => {
    const race = await startServer();
    try {
      const a = new Client(race.url);
      const b = new Client(race.url);

      const [resA, resB] = await Promise.all([
        a.form("/api/auth/setup-password", {
          email: "alice@example.com",
          password: "alice-long-password",
          confirm_password: "alice-long-password",
        }),
        b.form("/api/auth/setup-password", {
          email: "bob@example.com",
          password: "bob-long-password-2",
          confirm_password: "bob-long-password-2",
        }),
      ]);

      const locations = [resA, resB].map((r) => r.headers.get("location"));
      // The winner lands on the success redirect and is signed in; the loser
      // gets a clean bounce (never a 500), and only ever one of each.
      expect(locations.filter((l) => l === "/admin/register?pw=set")).toHaveLength(1);
      expect(locations.filter((l) => l === "/admin/login")).toHaveLength(1);
      expect([resA.status, resB.status]).toEqual([302, 302]);
      expect([a.jar.has("admin_session"), b.jar.has("admin_session")].filter(Boolean)).toHaveLength(1);

      // Exactly one admin ever exists, and it's the actual winner's email.
      const rows = race.sql<{ email: string }>("SELECT email FROM admin_password");
      expect(rows).toHaveLength(1);
      const winnerIsAlice = locations[0] === "/admin/register?pw=set";
      expect(rows[0].email).toBe(winnerIsAlice ? "alice@example.com" : "bob@example.com");
    } finally {
      await race.stop();
    }
  });
});
