/**
 * WebAuthn relying-party settings, read at *runtime*.
 *
 * `import.meta.env.X` is replaced by Vite at build time, so a value set only
 * on the container (Bunny, Coolify, docker run -e) never reached the server:
 * the image shipped with "localhost" baked in. `process.env` is read per call.
 *
 * Without configuration a production build falls back to the canonical site
 * (astro.config `site`), never to localhost.
 */
const SITE = new URL(import.meta.env.SITE ?? "https://fabio.sh");

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
}

export function rpId(): string {
  return env("ADMIN_RP_ID") ?? (import.meta.env.PROD ? SITE.hostname : "localhost");
}

export function rpOrigin(): string {
  return env("ADMIN_ORIGIN") ?? (import.meta.env.PROD ? SITE.origin : "http://localhost:4321");
}

export function rpName(): string {
  return env("ADMIN_RP_NAME") ?? "fabio.sh admin";
}
