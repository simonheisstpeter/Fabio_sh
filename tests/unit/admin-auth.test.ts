import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { fakeCookies, freshEnv } from "../helpers/unit";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function setup() {
  const env = freshEnv({ IP_HASH_SECRET: "s" });
  const auth = await env.auth();
  const { getDb } = await env.db();
  return { auth, db: getDb() };
}

describe("secureCookie", () => {
  it("is HttpOnly, SameSite=Strict, site-wide, and only sets maxAge when asked", async () => {
    const { auth } = await setup();
    expect(auth.secureCookie()).toMatchObject({ httpOnly: true, sameSite: "strict", path: "/" });
    expect(auth.secureCookie()).not.toHaveProperty("maxAge");
    expect(auth.secureCookie(60)).toMatchObject({ maxAge: 60 });
  });
});

describe("sessions", () => {
  it("stores only a SHA-256 digest of the token", async () => {
    const { auth, db } = await setup();
    const { cookies, sets } = fakeCookies();

    auth.createSession(cookies);

    const token = sets.admin_session.value;
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const rows = db.prepare("SELECT token FROM admin_sessions").all() as { token: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].token).toBe(sha256(token));
    expect(rows[0].token).not.toBe(token);
  });

  it("sets a 7-day, HttpOnly, SameSite=Strict cookie", async () => {
    const { auth } = await setup();
    const { cookies, sets } = fakeCookies();
    auth.createSession(cookies);
    expect(sets.admin_session.options).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  it("validates a freshly issued session", async () => {
    const { auth } = await setup();
    const { cookies, jar } = fakeCookies();
    auth.createSession(cookies);
    expect(auth.validateSession(fakeCookies({ admin_session: jar.get("admin_session")! }).cookies)).toBe(true);
  });

  it("rejects missing, unknown and malformed tokens", async () => {
    const { auth } = await setup();
    expect(auth.validateSession(fakeCookies().cookies)).toBe(false);
    expect(auth.validateSession(fakeCookies({ admin_session: "deadbeef" }).cookies)).toBe(false);
    expect(auth.validateSession(fakeCookies({ admin_session: "'; DROP TABLE admin_sessions;--" }).cookies)).toBe(
      false,
    );
  });

  it("does not accept a plaintext token that matches a stored row", async () => {
    // Regression guard for the hashing change: presenting the *stored* value
    // (what a leaked DB would give an attacker) must not log anyone in.
    const { auth, db } = await setup();
    const { cookies, jar } = fakeCookies();
    auth.createSession(cookies);
    const stored = (db.prepare("SELECT token FROM admin_sessions").get() as { token: string }).token;

    expect(auth.validateSession(fakeCookies({ admin_session: stored }).cookies)).toBe(false);
    expect(auth.validateSession(fakeCookies({ admin_session: jar.get("admin_session")! }).cookies)).toBe(true);
  });

  it("rejects an expired session", async () => {
    const { auth, db } = await setup();
    const { cookies, jar } = fakeCookies();
    auth.createSession(cookies);
    db.prepare("UPDATE admin_sessions SET expires_at = datetime('now', '-1 minute')").run();

    expect(auth.validateSession(fakeCookies({ admin_session: jar.get("admin_session")! }).cookies)).toBe(false);
  });

  it("purges expired sessions whenever a new one is created", async () => {
    const { auth, db } = await setup();
    db.prepare("INSERT INTO admin_sessions (token, expires_at) VALUES ('old', datetime('now','-1 day'))").run();

    auth.createSession(fakeCookies().cookies);

    const tokens = (db.prepare("SELECT token FROM admin_sessions").all() as { token: string }[]).map((r) => r.token);
    expect(tokens).not.toContain("old");
    expect(tokens).toHaveLength(1);
  });

  it("logout takes effect immediately, even though validation is cached", async () => {
    const { auth, db } = await setup();
    const issued = fakeCookies();
    auth.createSession(issued.cookies);
    const client = fakeCookies({ admin_session: issued.jar.get("admin_session")! });

    expect(auth.validateSession(client.cookies)).toBe(true); // now cached
    auth.deleteSession(client.cookies);

    expect(auth.validateSession(client.cookies)).toBe(false);
    expect(db.prepare("SELECT COUNT(*) n FROM admin_sessions").get()).toEqual({ n: 0 });
    expect(client.jar.has("admin_session")).toBe(false);
  });

  it("issues distinct tokens per login", async () => {
    const { auth } = await setup();
    const a = fakeCookies();
    const b = fakeCookies();
    auth.createSession(a.cookies);
    auth.createSession(b.cookies);
    expect(a.jar.get("admin_session")).not.toBe(b.jar.get("admin_session"));
  });
});

describe("credential enrolment gate", () => {
  it("is open on first run, when nothing is registered", async () => {
    const { auth } = await setup();
    expect(auth.credentialCounts()).toEqual({ passkeys: 0, passwords: 0 });
    expect(auth.canEnrolCredential(fakeCookies().cookies)).toBe(true);
  });

  it("is closed to anonymous visitors once a passkey exists", async () => {
    const { auth, db } = await setup();
    db.prepare("INSERT INTO webauthn_credentials (credential_id, public_key) VALUES ('c','k')").run();
    expect(auth.canEnrolCredential(fakeCookies().cookies)).toBe(false);
  });

  it("is closed to anonymous visitors once a password exists", async () => {
    const { auth, db } = await setup();
    db.prepare("INSERT INTO admin_password (id, email, hash) VALUES (1, 'a@b.c', 'h')").run();
    expect(auth.canEnrolCredential(fakeCookies().cookies)).toBe(false);
  });

  it("stays open to a signed-in admin", async () => {
    const { auth, db } = await setup();
    db.prepare("INSERT INTO admin_password (id, email, hash) VALUES (1, 'a@b.c', 'h')").run();
    db.prepare("INSERT INTO webauthn_credentials (credential_id, public_key) VALUES ('c','k')").run();
    const issued = fakeCookies();
    auth.createSession(issued.cookies);

    const admin = fakeCookies({ admin_session: issued.jar.get("admin_session")! });
    expect(auth.canEnrolCredential(admin.cookies)).toBe(true);
  });

  it("counts both credential kinds", async () => {
    const { auth, db } = await setup();
    db.prepare("INSERT INTO webauthn_credentials (credential_id, public_key) VALUES ('c1','k')").run();
    db.prepare("INSERT INTO webauthn_credentials (credential_id, public_key) VALUES ('c2','k')").run();
    db.prepare("INSERT INTO admin_password (id, email, hash) VALUES (1, 'a@b.c', 'h')").run();
    expect(auth.credentialCounts()).toEqual({ passkeys: 2, passwords: 1 });
  });
});

describe("WebAuthn challenges", () => {
  it("keeps the challenge server-side and hands the client only an opaque id", async () => {
    const { auth, db } = await setup();
    const { cookies, sets } = fakeCookies();

    auth.issueChallenge(cookies, "the-challenge", "login");

    const cookieValue = sets.__wac.value;
    expect(cookieValue).not.toBe("the-challenge");
    expect(cookieValue).toMatch(/^[0-9a-f]{48}$/);
    expect(sets.__wac.options).toMatchObject({ httpOnly: true, sameSite: "strict", maxAge: 300 });
    expect(db.prepare("SELECT id, challenge, purpose FROM auth_challenges").get()).toEqual({
      id: cookieValue,
      challenge: "the-challenge",
      purpose: "login",
    });
  });

  it("can be consumed exactly once", async () => {
    const { auth } = await setup();
    const issued = fakeCookies();
    auth.issueChallenge(issued.cookies, "c1", "register");
    const id = issued.jar.get("__wac")!;

    expect(auth.consumeChallenge(fakeCookies({ __wac: id }).cookies, "register")).toBe("c1");
    // A replay with the very same cookie value finds nothing.
    expect(auth.consumeChallenge(fakeCookies({ __wac: id }).cookies, "register")).toBeNull();
  });

  it("always clears the cookie, even when the challenge is bad", async () => {
    const { auth } = await setup();
    const client = fakeCookies({ __wac: "does-not-exist" });
    expect(auth.consumeChallenge(client.cookies, "login")).toBeNull();
    expect(client.jar.has("__wac")).toBe(false);
  });

  it("refuses a challenge issued for a different purpose", async () => {
    const { auth } = await setup();
    const issued = fakeCookies();
    auth.issueChallenge(issued.cookies, "c", "register");
    const id = issued.jar.get("__wac")!;

    expect(auth.consumeChallenge(fakeCookies({ __wac: id }).cookies, "login")).toBeNull();
    // Refusal didn't burn it — the right purpose still works.
    expect(auth.consumeChallenge(fakeCookies({ __wac: id }).cookies, "register")).toBe("c");
  });

  it("refuses an expired challenge", async () => {
    const { auth, db } = await setup();
    const issued = fakeCookies();
    auth.issueChallenge(issued.cookies, "c", "login");
    db.prepare("UPDATE auth_challenges SET expires_at = datetime('now', '-1 second')").run();

    expect(auth.consumeChallenge(fakeCookies({ __wac: issued.jar.get("__wac")! }).cookies, "login")).toBeNull();
  });

  it("returns null with no cookie at all", async () => {
    const { auth } = await setup();
    expect(auth.consumeChallenge(fakeCookies().cookies, "login")).toBeNull();
  });

  it("sweeps expired challenges when a new one is issued", async () => {
    const { auth, db } = await setup();
    auth.issueChallenge(fakeCookies().cookies, "old", "login");
    db.prepare("UPDATE auth_challenges SET expires_at = datetime('now', '-1 hour')").run();

    auth.issueChallenge(fakeCookies().cookies, "new", "login");

    const rows = db.prepare("SELECT challenge FROM auth_challenges").all() as { challenge: string }[];
    expect(rows).toEqual([{ challenge: "new" }]);
  });
});
