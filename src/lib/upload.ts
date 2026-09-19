import { MAX_UPLOAD_BYTES } from "./limits.js";

type FileKind = "pdf" | "jpeg" | "png";

/**
 * Content-sniffing — the filename extension and the client-supplied
 * Content-Type are both trivially forged, so the magic bytes decide.
 */
function sniff(buf: Buffer): FileKind | null {
  if (buf.length < 4) return null;
  if (buf.subarray(0, 4).toString("binary") === "%PDF") return "pdf";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 4).toString("binary") === "\x89PNG") return "png";
  return null;
}

type UploadResult =
  | { ok: true; buffer: Buffer; name: string }
  | { ok: false; error: string };

/**
 * Validates an optional file field; returns `null` when nothing was uploaded.
 * Defaults to PDF/JPG/PNG — pass `["pdf"]` where only a PDF makes sense.
 */
export async function readUploadedFile(
  file: File | null,
  allowed: readonly FileKind[] = ["pdf", "jpeg", "png"],
): Promise<UploadResult | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "File too large (max 10 MB)" };

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniff(buffer);
  if (!kind || !allowed.includes(kind)) {
    const names = allowed.map((k) => (k === "jpeg" ? "JPG" : k.toUpperCase())).join(", ");
    return { ok: false, error: `Unsupported file type (${names} only)` };
  }
  return { ok: true, buffer, name: file.name };
}
