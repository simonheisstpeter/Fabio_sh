import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBlob } from "../../src/lib/atproto";

const CID = "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku";
const MB = 1024 * 1024;

afterEach(() => vi.unstubAllGlobals());

function stubFetch(res: Response) {
  const fn = vi.fn(async (_url: string) => res);
  vi.stubGlobal("fetch", fn);
  return fn;
}

async function readAll(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return total;
    total += value.byteLength;
  }
}

/** A body that emits `chunks` × 1 MB with no Content-Length. */
function bigStream(chunks: number) {
  let sent = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (sent++ >= chunks) controller.close();
      else controller.enqueue(new Uint8Array(MB));
    },
  });
}

describe("fetchBlob", () => {
  it.each(["", "../../etc/passwd", "bafy/../x", "QmNotBase32", "ba", "bafk reihd", "a".repeat(200)])(
    "rejects a malformed cid without any network call (%j)",
    async (cid) => {
      const fetchMock = stubFetch(new Response("x"));
      expect(await fetchBlob(cid)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("only ever talks to the fixed PDS host and path", async () => {
    const fetchMock = stubFetch(new Response("img", { headers: { "content-type": "image/png" } }));
    await fetchBlob(CID);
    const url = String(fetchMock.mock.calls[0]![0]);
    expect(url.startsWith("https://at.fabio.sh/xrpc/com.atproto.sync.getBlob?did=did:plc:")).toBe(true);
    expect(url.endsWith(`&cid=${CID}`)).toBe(true);
  });

  it("streams an image through unchanged", async () => {
    stubFetch(new Response(new Uint8Array([1, 2, 3, 4]), { headers: { "content-type": "image/webp" } }));
    const blob = await fetchBlob(CID);
    expect(blob?.contentType).toBe("image/webp");
    expect(await readAll(blob!.body)).toBe(4);
  });

  it("allows video", async () => {
    stubFetch(new Response("v", { headers: { "content-type": "video/mp4" } }));
    expect((await fetchBlob(CID))?.contentType).toBe("video/mp4");
  });

  it.each(["text/html", "application/json", "application/octet-stream"])(
    "refuses non-media content (%s)",
    async (type) => {
      stubFetch(new Response("<script>", { headers: { "content-type": type } }));
      expect(await fetchBlob(CID)).toBeNull();
    },
  );

  it("returns null for upstream errors", async () => {
    stubFetch(new Response("nope", { status: 404, headers: { "content-type": "image/png" } }));
    expect(await fetchBlob(CID)).toBeNull();
  });

  it("returns null (not a throw) when the PDS is unreachable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("down"))));
    expect(await fetchBlob(CID)).toBeNull();
  });

  it("refuses up front when Content-Length exceeds the cap", async () => {
    stubFetch(new Response("x", { headers: { "content-type": "video/mp4", "content-length": String(31 * MB) } }));
    expect(await fetchBlob(CID)).toBeNull();
  });

  it("errors the stream if an undeclared body grows past the 30 MB cap", async () => {
    stubFetch(new Response(bigStream(32), { headers: { "content-type": "video/mp4" } }));
    const blob = await fetchBlob(CID);
    expect(blob).not.toBeNull();
    await expect(readAll(blob!.body)).rejects.toThrow(/size cap/);
  });

  it("lets a body just under the cap through", async () => {
    stubFetch(new Response(bigStream(29), { headers: { "content-type": "video/mp4" } }));
    const blob = await fetchBlob(CID);
    expect(await readAll(blob!.body)).toBe(29 * MB);
  });
});
