# fabio.sh

Personal website — built with Astro 5 (SSR), Tailwind CSS 4, SQLite via `node:sqlite`.

## Stack

- **Framework**: Astro 5, `output: server`, `@astrojs/node` standalone adapter
- **Styling**: Tailwind CSS 4 via `@tailwindcss/vite`
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

## Docker

Multi-stage build — builder installs all deps and compiles, runner only gets the two runtime packages (`@astrojs/node`, `@simplewebauthn/server`) plus `dist/`.

```bash
docker build -t fabio-sh .
docker run -p 4321:4321 -v $(pwd)/db:/app/db fabio-sh
```

Deployed via Coolify. The `backups/` and `db/` directories should be on a persistent volume.

The entrypoint starts as root only to `chown` the mounted `db/` volume, then runs migrations and the server as the unprivileged `node` user (via `su-exec`). A `HEALTHCHECK` polls `/robots.txt`. Scripts run from a Coolify terminal execute as root — if one creates new files in `db/`, restart the container so the entrypoint re-applies ownership.

## Environment variables

| Variable         | Default       | Description                                                                            |
| ---------------- | ------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_PATH`  | `db/fabio.db` | Path to the SQLite database file                                                       |
| `IP_HASH_SECRET` | random per process | HMAC key for hashing client IPs in rate limits. Set a stable random value in production, otherwise limits reset on every restart |
| `ADMIN_ORIGIN`   | `http://localhost:4321` | Expected origin for passkey (WebAuthn) ceremonies, e.g. `https://fabio.sh` |
| `ADMIN_RP_ID`    | `localhost`   | WebAuthn relying-party id — the bare domain, e.g. `fabio.sh`                            |
| `ADMIN_RP_NAME`  | `fabio.sh admin` | Display name shown in the passkey prompt                                             |
| `TIDAL_MAIL` / `TIDAL_PASSWORD` | – | Credentials for the "last played" widget (optional)                              |
| `HOST`           | `0.0.0.0`     | Server bind address                                                                    |
| `PORT`           | `4321`        | Server port                                                                            |
