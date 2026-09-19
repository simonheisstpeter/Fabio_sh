import { describe, expect, it } from "vitest";
import { readUploadedFile } from "../../src/lib/upload";
import { MAX_UPLOAD_BYTES } from "../../src/lib/limits.js";
import { makeFile } from "../helpers/unit";

const PDF = Buffer.from("%PDF-1.7\n...");
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

describe("readUploadedFile", () => {
  it("returns null when nothing was uploaded", async () => {
    expect(await readUploadedFile(null)).toBeNull();
    expect(await readUploadedFile(makeFile(new Uint8Array(0)))).toBeNull();
  });

  it.each([
    ["PDF", PDF],
    ["PNG", PNG],
    ["JPEG", JPEG],
  ])("accepts a real %s by default", async (_kind, bytes) => {
    const result = await readUploadedFile(makeFile(bytes, "cert.bin"));
    expect(result).toMatchObject({ ok: true, name: "cert.bin" });
    expect(result && result.ok && result.buffer.equals(bytes)).toBe(true);
  });

  it("trusts the content, not the filename or extension", async () => {
    const result = await readUploadedFile(makeFile("<script>alert(1)</script>", "totally-a.pdf"));
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/Unsupported file type/) });
  });

  it("rejects files too short to identify", async () => {
    const result = await readUploadedFile(makeFile(Buffer.from("%PD")));
    expect(result).toMatchObject({ ok: false });
  });

  it("can be restricted to PDFs only", async () => {
    const png = await readUploadedFile(makeFile(PNG), ["pdf"]);
    expect(png).toEqual({ ok: false, error: "Unsupported file type (PDF only)" });
    expect(await readUploadedFile(makeFile(PDF), ["pdf"])).toMatchObject({ ok: true });
  });

  it("names every allowed type in the error", async () => {
    const result = await readUploadedFile(makeFile("nope nope"));
    expect(result).toEqual({ ok: false, error: "Unsupported file type (PDF, JPG, PNG only)" });
  });

  it("enforces the size cap before reading the content", async () => {
    const tooBig = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    tooBig.set(PDF); // valid magic bytes, but too large
    const result = await readUploadedFile(makeFile(tooBig));
    expect(result).toEqual({ ok: false, error: "File too large (max 10 MB)" });
  });

  it("accepts a file exactly at the cap", async () => {
    const atCap = new Uint8Array(MAX_UPLOAD_BYTES);
    atCap.set(PDF);
    expect(await readUploadedFile(makeFile(atCap))).toMatchObject({ ok: true });
  });
});
