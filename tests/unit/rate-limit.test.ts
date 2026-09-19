import { afterEach, describe, expect, it, vi } from "vitest";
import { freshEnv } from "../helpers/unit";

afterEach(() => vi.restoreAllMocks());

describe("checkRateLimit", () => {
  it("allows up to the limit, then blocks", async () => {
    const { rate } = freshEnv({ IP_HASH_SECRET: "s" });
    const { checkRateLimit } = await rate();

    const results = [1, 2, 3, 4].map(() => checkRateLimit("k", 3, 3600));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results.map((r) => r.count)).toEqual([1, 2, 3, 4]);
  });

  it("keeps separate keys independent", async () => {
    const { rate } = freshEnv({ IP_HASH_SECRET: "s" });
    const { checkRateLimit } = await rate();

    checkRateLimit("a", 1, 3600);
    expect(checkRateLimit("a", 1, 3600).allowed).toBe(false);
    expect(checkRateLimit("b", 1, 3600).allowed).toBe(true);
  });

  it("starts a fresh window once the old one has expired", async () => {
    const { rate, db } = freshEnv({ IP_HASH_SECRET: "s" });
    const { checkRateLimit } = await rate();
    const { getDb } = await db();

    checkRateLimit("k", 1, 60);
    expect(checkRateLimit("k", 1, 60).allowed).toBe(false);

    getDb().prepare("UPDATE rate_limits SET window_start = datetime('now', '-2 minutes')").run();
    expect(checkRateLimit("k", 1, 60)).toEqual({ allowed: true, count: 1 });
  });

  it("does not extend the window on every hit (no sliding-forever lockout)", async () => {
    const { rate, db } = freshEnv({ IP_HASH_SECRET: "s" });
    const { checkRateLimit } = await rate();
    const { getDb } = await db();

    checkRateLimit("k", 5, 3600);
    const before = getDb().prepare("SELECT window_start FROM rate_limits").get();
    checkRateLimit("k", 5, 3600);
    expect(getDb().prepare("SELECT window_start FROM rate_limits").get()).toEqual(before);
  });

  it("resetRateLimit forgets a key", async () => {
    const { rate } = freshEnv({ IP_HASH_SECRET: "s" });
    const { checkRateLimit, resetRateLimit } = await rate();

    checkRateLimit("k", 1, 3600);
    expect(checkRateLimit("k", 1, 3600).allowed).toBe(false);
    resetRateLimit("k");
    expect(checkRateLimit("k", 1, 3600).allowed).toBe(true);
  });

  it("sweeps long-stale rows so the table can't grow without bound", async () => {
    const { rate, db } = freshEnv({ IP_HASH_SECRET: "s" });
    const { checkRateLimit } = await rate();
    const { getDb } = await db();

    checkRateLimit("stale", 5, 3600);
    getDb().prepare("UPDATE rate_limits SET window_start = datetime('now', '-3 days')").run();

    for (let i = 0; i < 50; i++) checkRateLimit(`other-${i % 3}`, 1000, 3600);

    const keys = (getDb().prepare("SELECT ip_hash FROM rate_limits").all() as { ip_hash: string }[]).map(
      (r) => r.ip_hash,
    );
    expect(keys).not.toContain("stale");
    expect(keys).toContain("other-0");
  });
});

describe("rateLimitKeyFor", () => {
  it("namespaces the key and never contains the raw address", async () => {
    const { rate } = freshEnv({ IP_HASH_SECRET: "s" });
    const { rateLimitKeyFor } = await rate();

    const key = rateLimitKeyFor("203.0.113.9", "contact");
    expect(key.startsWith("contact:")).toBe(true);
    expect(key).not.toContain("203.0.113.9");
    expect(key).toMatch(/^contact:[0-9a-f]{64}$/);
  });

  it("is stable per client but differs across clients and namespaces", async () => {
    const { rate } = freshEnv({ IP_HASH_SECRET: "s" });
    const { rateLimitKeyFor } = await rate();

    expect(rateLimitKeyFor("1.1.1.1", "login")).toBe(rateLimitKeyFor("1.1.1.1", "login"));
    expect(rateLimitKeyFor("1.1.1.1", "login")).not.toBe(rateLimitKeyFor("2.2.2.2", "login"));
    expect(rateLimitKeyFor("1.1.1.1", "login")).not.toBe(rateLimitKeyFor("1.1.1.1", "cv"));
  });

  it("copes with a missing address", async () => {
    const { rate } = freshEnv({ IP_HASH_SECRET: "s" });
    const { rateLimitKeyFor } = await rate();
    expect(rateLimitKeyFor(undefined, "login")).toMatch(/^login:[0-9a-f]{64}$/);
  });
});

describe("hashIp", () => {
  it("is keyed: the same address hashes differently under a different secret", async () => {
    const a = await freshEnv({ IP_HASH_SECRET: "secret-a" }).db();
    const hashA = a.hashIp("9.9.9.9");
    const b = await freshEnv({ IP_HASH_SECRET: "secret-b" }).db();
    expect(b.hashIp("9.9.9.9")).not.toBe(hashA);
  });

  it.each([undefined, "changeme"])(
    "never falls back to a guessable default (IP_HASH_SECRET=%j)",
    async (configured) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const first = await freshEnv({ IP_HASH_SECRET: configured }).db();
      const h = first.hashIp("9.9.9.9");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("IP_HASH_SECRET"));

      // Deterministic within a process…
      expect(first.hashIp("9.9.9.9")).toBe(h);
      // …but not the value an attacker could precompute from "changeme".
      const known = await freshEnv({ IP_HASH_SECRET: "some-other-secret" }).db();
      expect(known.hashIp("9.9.9.9")).not.toBe(h);
    },
  );
});
