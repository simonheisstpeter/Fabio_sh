// Generates public/meta_pic.webp from public/meta_pic.png at build time so
// the binary never has to be committed. Uses sharp, already in the tree via
// Astro's image pipeline. Skips when the webp is newer than the png.
import { existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const png = join(root, "public/meta_pic.png");
const webp = join(root, "public/meta_pic.webp");

if (existsSync(webp) && statSync(webp).mtimeMs >= statSync(png).mtimeMs) {
  process.exit(0);
}

const { default: sharp } = await import("sharp");
// Displayed at 288px wide; 576px covers 2x retina.
const info = await sharp(png).resize(576).webp({ quality: 80 }).toFile(webp);
console.log(`meta_pic.webp: ${info.width}x${info.height}, ${info.size} bytes`);
