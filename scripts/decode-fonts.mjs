// The Handjet woff2 files are committed as base64 text (scripts/fonts/*.b64)
// because they must survive text-only transports; this script materializes
// them into public/fonts/. Runs automatically via the predev/prebuild hooks.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const here = import.meta.dirname;
const srcDir = join(here, "fonts");
const outDir = join(here, "..", "public", "fonts");

mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(srcDir)) {
  if (!name.endsWith(".woff2.b64")) continue;
  const out = join(outDir, name.replace(/\.b64$/, ""));
  writeFileSync(out, Buffer.from(readFileSync(join(srcDir, name), "utf8"), "base64"));
  console.log("decoded", out);
}
