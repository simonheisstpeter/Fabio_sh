import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { vi } from "vitest";
import type { AstroCookies } from "astro";

/**
 * A pristine module graph pointed at a brand-new SQLite file.
 *
 * `lib/db.ts` reads DATABASE_PATH once at import, so each test resets the
 * module registry and imports the libs afresh — no state leaks between tests.
 */
export function freshEnv(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  const dir = mkdtempSync(join(tmpdir(), "fabio-unit-"));
  process.env.DATABASE_PATH = join(dir, "test.db");
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return {
    dir,
    dbPath: process.env.DATABASE_PATH,
    db: () => import("../../src/lib/db"),
    auth: () => import("../../src/lib/admin-auth"),
    rate: () => import("../../src/lib/rate-limit"),
  };
}

type CookieSet = { value: string; options: Record<string, unknown> | undefined };

/** Minimal stand-in for Astro's cookie jar that records how cookies were set. */
export function fakeCookies(initial: Record<string, string> = {}) {
  const jar = new Map(Object.entries(initial));
  const sets: Record<string, CookieSet> = {};
  const cookies = {
    get: (name: string) => (jar.has(name) ? { value: jar.get(name)! } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      jar.set(name, value);
      sets[name] = { value, options };
    },
    delete: (name: string) => {
      jar.delete(name);
    },
    has: (name: string) => jar.has(name),
  };
  return { cookies: cookies as unknown as AstroCookies, jar, sets };
}

export function makeFile(content: Uint8Array | string, name = "file.bin"): File {
  return new File([content as BlobPart], name);
}
