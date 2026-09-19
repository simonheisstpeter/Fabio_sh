import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SESSION = { sessionId: "sid", userId: 7, countryCode: "AT" };
const TRACK = {
  title: "Song",
  artists: [{ name: "A" }, { name: "B" }],
  album: { title: "Album", cover: "ab-cd-ef" },
  url: "https://tidal.com/track/1",
};

function mockTidal(opts: { fail?: boolean; delay?: number } = {}) {
  const calls: string[] = [];
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (opts.delay) await new Promise((r) => setTimeout(r, opts.delay));
    if (opts.fail) throw new Error("network down");
    if (url.includes("/login/username")) return Response.json(SESSION);
    return Response.json({ items: [{ track: TRACK }] });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

async function load() {
  vi.resetModules();
  return import("../../src/lib/tidal");
}

beforeEach(() => {
  process.env.TIDAL_MAIL = "me@example.com";
  process.env.TIDAL_PASSWORD = "secret";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.TIDAL_MAIL;
  delete process.env.TIDAL_PASSWORD;
});

describe("getLastPlayed", () => {
  it("logs in, fetches the latest playback and maps the track", async () => {
    const { calls } = mockTidal();
    const { getLastPlayed } = await load();

    expect(await getLastPlayed()).toEqual({
      title: "Song",
      artist: "A, B",
      album: "Album",
      coverUrl: "https://resources.tidal.com/images/ab/cd/ef/320x320.jpg",
      trackUrl: "https://tidal.com/track/1",
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("/login/username");
    expect(calls[1]).toContain("/users/7/playbacksessions");
  });

  it("shares one login across concurrent callers (no per-visitor Tidal logins)", async () => {
    const { fetchMock } = mockTidal({ delay: 30 });
    const { getLastPlayed } = await load();

    const results = await Promise.all(Array.from({ length: 10 }, () => getLastPlayed()));

    expect(new Set(results.map((r) => r?.title))).toEqual(new Set(["Song"]));
    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 login + 1 playback, not 20
  });

  it("serves from cache within the TTL", async () => {
    const { fetchMock } = mockTidal();
    const { getLastPlayed } = await load();

    await getLastPlayed();
    await getLastPlayed();
    await getLastPlayed();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refreshes once the 30 s cache has expired", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const { fetchMock } = mockTidal();
      const { getLastPlayed } = await load();

      await getLastPlayed();
      vi.setSystemTime(Date.now() + 31_000);
      await getLastPlayed();
      expect(fetchMock).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it("degrades to null on failure and negative-caches so it doesn't hammer Tidal", async () => {
    const { fetchMock } = mockTidal({ fail: true });
    const { getLastPlayed } = await load();

    expect(await getLastPlayed()).toBeNull();
    expect(await getLastPlayed()).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("recovers after a failure once the short negative cache lapses", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      mockTidal({ fail: true });
      const { getLastPlayed } = await load();
      expect(await getLastPlayed()).toBeNull();

      mockTidal();
      vi.setSystemTime(Date.now() + 11_000);
      expect((await getLastPlayed())?.title).toBe("Song");
    } finally {
      vi.useRealTimers();
    }
  });

  it("returns null without touching the network when credentials are missing", async () => {
    delete process.env.TIDAL_MAIL;
    const { fetchMock } = mockTidal();
    const { getLastPlayed } = await load();

    expect(await getLastPlayed()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when Tidal rejects the login", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 401 })));
    const { getLastPlayed } = await load();
    expect(await getLastPlayed()).toBeNull();
  });

  it("returns null when the history is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request) =>
        String(input).includes("/login/") ? Response.json(SESSION) : Response.json({ items: [] }),
      ),
    );
    const { getLastPlayed } = await load();
    expect(await getLastPlayed()).toBeNull();
  });
});
