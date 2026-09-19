import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { fetchWithTimeout } from "../../src/lib/http";

let server: Server | undefined;

async function listen(handler: Parameters<typeof createServer>[1]) {
  server = createServer(handler);
  await new Promise<void>((r) => server!.listen(0, "127.0.0.1", r));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
  server?.closeAllConnections();
  await new Promise((r) => server?.close(r));
  server = undefined;
});

describe("fetchWithTimeout", () => {
  it("resolves normally when the server answers in time", async () => {
    const url = await listen((_req, res) => res.end("hi"));
    const res = await fetchWithTimeout(url, 2000);
    expect(await res.text()).toBe("hi");
  });

  it("aborts a request that never gets a response", async () => {
    const url = await listen(() => {
      /* never answers */
    });
    const started = Date.now();
    await expect(fetchWithTimeout(url, 100)).rejects.toMatchObject({ name: "AbortError" });
    expect(Date.now() - started).toBeLessThan(1500);
  });

  it("passes init options through", async () => {
    const url = await listen((req, res) => {
      res.end(`${req.method}:${req.headers["x-test"]}`);
    });
    const res = await fetchWithTimeout(url, 2000, { method: "POST", headers: { "x-test": "yes" } });
    expect(await res.text()).toBe("POST:yes");
  });
});
