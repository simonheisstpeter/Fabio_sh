import type { APIRoute } from "astro";
import { tmpdir } from "os";
import { join } from "path";
import { readFile, rm } from "fs/promises";
import { getDb } from "../../../lib/db";

// Auth is enforced for all of /api/admin/** in middleware.ts.
export const GET: APIRoute = async () => {
  // Path is ours (tmpdir + timestamp), never user input — safe to inline.
  const tmpPath = join(tmpdir(), `fabio-backup-${Date.now()}.db`);

  try {
    getDb().exec(`VACUUM INTO '${tmpPath.replace(/'/g, "''")}'`);
    const buffer = await readFile(tmpPath);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="fabio-${date}.db"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } finally {
    await rm(tmpPath, { force: true });
  }
};
