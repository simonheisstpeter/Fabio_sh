export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Content-sniffing check — the filename extension and the client-supplied
 * Content-Type are both trivially forged, so the magic bytes decide.
 */
export function checkMagicBytes(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  if (buf.subarray(0, 4).toString("binary") === "%PDF") return true; // PDF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true; // JPEG
  if (buf.subarray(0, 4).toString("binary") === "\x89PNG") return true; // PNG
  return false;
}

export type UploadResult =
  | { ok: true; buffer: Buffer; name: string }
  | { ok: false; error: string };

/** Validates an optional file field; returns `null` when nothing was uploaded. */
export async function readUploadedFile(file: File | null): Promise<UploadResult | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_SIZE) return { ok: false, error: "File too large (max 10 MB)" };

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!checkMagicBytes(buffer)) {
    return { ok: false, error: "Unsupported file type (PDF, JPG, PNG only)" };
  }
  return { ok: true, buffer, name: file.name };
}
