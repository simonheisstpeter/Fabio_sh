# fabio.sh

Personal website — built with Astro 5 (SSR), plain CSS, SQLite via `node:sqlite`.

## Stack

- **Framework**: Astro 5, `output: server`, `@astrojs/node` standalone adapter
- **Styling**: hand-written CSS in `src/styles/globals.css` — black & white, simple HTML elements with pixel-block accents (no framework)
- **Database**: SQLite via Node's built-in `node:sqlite` — file at `db/fabio.db`
- **Auth**: WebAuthn passkeys + scrypt password hashing via `node:crypto`
- **i18n**: Astro built-in, 23 locales (de default/no prefix, all others prefixed)
- **Deploy**: Docker on VPS via Coolify — `node dist/server/entry.mjs`

## Development

```bash
npm run dev       # start dev server at http://localhost:4321
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

## Database

SQLite database lives at `db/fabio.db`. The schema is owned by versioned migrations (`src/lib/migrations.js`): the container entrypoint runs `node src/lib/migrate.js up` before the server starts, snapshotting the DB to `db/backups/` first (the newest 5 snapshots are kept). A failing migration aborts the start-up instead of failing every request.

```bash
npm run seed      # one-shot: populate projects table from seed data
```

## Scripts

All scripts read `DATABASE_PATH` env var and fall back to `db/fabio.db`.

### Backup

Creates a timestamped snapshot in `backups/` using SQLite's `VACUUM INTO` — consistent even under active writes.

```bash
npm run backup
# Backing up db/fabio.db → backups/fabio-2026-05-04T14-30-00.db
# Done — 312.0 KB
```

Pull a backup from the VPS:

```bash
scp user@your-vps:/app/backups/fabio-2026-05-04T14-30-00.db .
```

A "Download Database" button is also available in the admin dashboard.

### Manage passkeys (admin settings)

Signed in, open **/admin/settings** to list your passkeys, register a new one, remove a single passkey, or reset all of them (asks for your password again). Removals never take away your last way to sign in: the last credential can't be removed, and a full passkey reset needs a password to exist, so first-run setup never reopens to strangers.

### Reset admin credentials

Clears `admin_password`, `webauthn_credentials`, `admin_sessions` and pending challenges so you can re-register at `/admin/register`. Useful when locked out. (Credential enrolment is only open to a signed-in admin, or while nothing is registered — hence passkeys are cleared too.)

```bash
npm run reset-admin
# Admin password and sessions cleared. Visit /admin/register to set a new password.
```

If `sqlite3` CLI is not available (e.g. inside the Alpine Docker container), use the inline Node equivalent:

```bash
node --input-type=module --eval "
import { DatabaseSync } from 'node:sqlite';
import { join } from 'path';
const db = new DatabaseSync(process.env.DATABASE_PATH ?? join(process.cwd(), 'db/fabio.db'));
db.exec('DELETE FROM admin_password');
db.exec('DELETE FROM webauthn_credentials');
db.exec('DELETE FROM admin_sessions');
db.close();
console.log('Done.');
"
```

## Tests

```bash
npm test          # unit tests — libs against throwaway SQLite files (~2 s)
npm run test:e2e  # builds the app, boots the real server per test file (~15 s)
npm run test:all  # both
```

- **Unit** (`tests/unit/`): migrations, sessions and challenges, the rate limiter, DB helpers (transactions, cascades, no-N+1), upload sniffing, form parsing, Tidal/ATProto clients (network mocked).
- **E2E** (`tests/e2e/`): drives the production build over HTTP — admin enrolment lock, CSRF, rate limits, upload validation, certificate visibility, security headers, the admin forms. Each file gets its own port and scratch database, so nothing touches `db/fabio.db`. Set `E2E_SKIP_BUILD=1` to reuse an existing `dist/`.
- **Not covered:** the successful WebAuthn ceremony (needs a real authenticator) and the ATProto feed parsing in `getSocialFeed`.

## Docker

Multi-stage build — builder installs all deps and compiles, runner only gets the two runtime packages (`@astrojs/node`, `@simplewebauthn/server`) plus `dist/`.

```bash
docker build -t fabio-sh .
docker run -p 4321:4321 -v $(pwd)/db:/app/db fabio-sh
```

Deployed as a container (Bunny Magic Containers; previously Coolify). The `backups/` and `db/` directories must be on a persistent volume: an empty database reopens first-run admin setup to whoever visits `/admin/register` first. Run a single instance, since each replica would get its own SQLite file.

Behind Bunny CDN, set `CLIENT_IP_HEADER=x-real-ip` and lock the container to the CDN:

1. Generate a secret: `openssl rand -hex 32`.
2. In the pull zone that serves fabio.sh, add an edge rule: action **Set Request Header**, header `X-Origin-Secret`, value = the secret, condition: request URL matches `*`.
3. Only then set `ORIGIN_SECRET` to the same value on the container and redeploy (the other order locks everyone out until step 2 is done).
4. Check: the site works on fabio.sh; a request straight to the container address (bunny.run hostname or Anycast IP) without the header gets `403`. Pages that are not explicitly public send `Cache-Control: private, no-store`, so the edge never stores admin pages, API responses or `/cv`.

The entrypoint starts as root only to `chown` the mounted `db/` volume, then runs migrations and the server as the unprivileged `node` user (via `su-exec`). A `HEALTHCHECK` polls `/robots.txt`. Scripts run from a Coolify terminal execute as root — if one creates new files in `db/`, restart the container so the entrypoint re-applies ownership.

## Environment variables

| Variable         | Default       | Description                                                                            |
| ---------------- | ------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_PATH`  | `db/fabio.db` | Path to the SQLite database file                                                       |
| `IP_HASH_SECRET` | random per process | HMAC key for hashing client IPs in rate limits. Set a stable random value in production, otherwise limits reset on every restart |
| `ADMIN_ORIGIN`   | `https://fabio.sh` (dev: `http://localhost:4321`) | Expected origin for passkey (WebAuthn) ceremonies. Read at runtime |
| `ADMIN_RP_ID`    | `fabio.sh` (dev: `localhost`) | WebAuthn relying-party id — the bare domain. Read at runtime                  |
| `ORIGIN_SECRET` | – | At least 32 random chars. When set, every request must carry it in `X-Origin-Secret` (added by the CDN), so the container can't be used around the CDN. `/robots.txt` stays open for health checks |
| `CLIENT_IP_HEADER` | – | Header the CDN writes with the visitor's IP, used for rate limits. Behind Bunny set `x-real-ip`. Unset, Astro's left-most `X-Forwarded-For` hop is used, which a visitor can forge |
| `ADMIN_RP_NAME`  | `fabio.sh admin` | Display name shown in the passkey prompt                                             |
| `TIDAL_MAIL` / `TIDAL_PASSWORD` | – | Credentials for the "last played" widget (optional)                              |
| `HOST`           | `0.0.0.0`     | Server bind address                                                                    |
| `PORT`           | `4321`        | Server port                                                                            |
