import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client, PASSWORD, signedInClient, startServer, type Server } from "./harness";

let s: Server;
let admin: Client;
const passkeyCount = () => (s.sql("SELECT COUNT(*) n FROM webauthn_credentials")[0] as { n: number }).n;
const addPasskey = (id: string) =>
  s.sql(
    "INSERT INTO webauthn_credentials (credential_id, public_key, device_type, backed_up, transports) VALUES (?, 'k', 'multiDevice', 1, '[\"internal\"]')",
    id,
  );

beforeAll(async () => {
  s = await startServer();
  admin = await signedInClient(s); // first-run: creates the password + session
});
afterAll(() => s.stop());

// These run in order: each step builds on the state left by the one before.
describe("admin settings: passkey management", () => {
  it("keeps the settings page and API behind a session", async () => {
    const anon = new Client(s.url);
    const page = await anon.get("/admin/settings");
    expect(page.status).toBe(302);
    expect(page.headers.get("location")).toBe("/admin/login");
    const del = await anon.fetch("/api/admin/passkeys/x", { method: "DELETE" });
    expect(del.status).toBe(401);
    const reset = await anon.form("/api/admin/passkeys/reset", { password: PASSWORD });
    expect(reset.status).toBe(401);
  });

  it("is linked from the admin nav and lists registered passkeys", async () => {
    addPasskey("pk-alpha-0123456789");
    addPasskey("pk-beta-0123456789");
    const html = await (await admin.get("/admin/settings")).text();
    expect(html).toContain('href="/admin/settings"');
    expect(html).toContain('data-passkey="pk-alpha-0123456789"');
    expect(html).toContain('data-passkey="pk-beta-0123456789"');
    expect(html).toContain("Synced passkey");
    expect(html).toContain('action="/api/admin/passkeys/reset"');
  });

  it("blocks cross-origin removal", async () => {
    const res = await admin.fetch("/api/admin/passkeys/pk-alpha-0123456789", {
      method: "DELETE",
      headers: { origin: "https://evil.example" },
    });
    expect(res.status).toBe(403);
    expect(passkeyCount()).toBe(2);
  });

  it("removes one passkey (form fallback) and reports unknown ids", async () => {
    const res = await admin.form("/api/admin/passkeys/pk-alpha-0123456789", { _method: "DELETE" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/admin/settings?ok=removed");
    expect(passkeyCount()).toBe(1);
    const missing = await admin.fetch("/api/admin/passkeys/does-not-exist", { method: "DELETE" });
    expect(missing.status).toBe(404);
  });

  it("asks for the password again before resetting all passkeys", async () => {
    s.clearRateLimits();
    const wrong = await admin.form("/api/admin/passkeys/reset", { password: "not-the-password" });
    expect(wrong.headers.get("location")).toBe("/admin/settings?error=password");
    expect(passkeyCount()).toBe(1);

    const ok = await admin.form("/api/admin/passkeys/reset", { password: PASSWORD });
    expect(ok.headers.get("location")).toBe("/admin/settings?ok=reset&n=1");
    expect(passkeyCount()).toBe(0);
    // the admin stays signed in and can register a replacement right away
    expect((await admin.get("/admin/settings")).status).toBe(200);
    expect((await admin.fetch("/api/auth/register-start", { method: "POST" })).status).toBe(200);
  });

  it("rate limits password re-entry", async () => {
    s.clearRateLimits();
    let last: Response | undefined;
    for (let i = 0; i < 6; i++) last = await admin.form("/api/admin/passkeys/reset", { password: "wrong" });
    expect(last!.headers.get("location")).toBe("/admin/settings?error=ratelimit");
    s.clearRateLimits();
  });

  it("never removes the last way to sign in", async () => {
    // passkey-only admin: drop the password, keep one passkey
    addPasskey("pk-last-0123456789");
    s.sql("DELETE FROM admin_password");

    const json = await admin.fetch("/api/admin/passkeys/pk-last-0123456789", { method: "DELETE" });
    expect(json.status).toBe(409);
    const form = await admin.form("/api/admin/passkeys/pk-last-0123456789", { _method: "DELETE" });
    expect(form.headers.get("location")).toBe("/admin/settings?error=last");
    const reset = await admin.form("/api/admin/passkeys/reset", { password: PASSWORD });
    expect(reset.headers.get("location")).toBe("/admin/settings?error=nopassword");
    expect(passkeyCount()).toBe(1);

    const html = await (await admin.get("/admin/settings")).text();
    expect(html).toContain("is your only way to sign in");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>\s*Remove/);
    // and setup stays closed to strangers
    expect((await new Client(s.url).get("/admin/register")).status).toBe(302);
  });
});
