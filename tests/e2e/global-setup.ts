import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");

/**
 * Build the production server once for the whole run.
 *
 * NODE_ENV must be forced: Vitest exports NODE_ENV=test, which Vite would
 * inherit — `import.meta.env.PROD` would then be false and the build would
 * quietly behave like dev (non-Secure cookies, the dev-only /test page, …).
 */
export default function setup() {
  if (process.env.E2E_SKIP_BUILD && existsSync(join(root, "dist/server/entry.mjs"))) return;
  execFileSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "pipe",
    env: { ...process.env, NODE_ENV: "production" },
  });
}
