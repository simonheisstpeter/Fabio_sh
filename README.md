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

SQLite database lives at `db/fabio.db`. The schema is created automatically on first run.

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

Clears the `admin_password` and `admin_sessions` tables so you can re-register at `/admin/register`. Useful when migrating password hashing schemes or locked out.

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

## Environment variables

| Variable         | Default       | Description                                                                            |
| ---------------- | ------------- | -------------------------------------------------------------------------------------- |
| `DATABASE_PATH`  | `db/fabio.db` | Path to the SQLite database file                                                       |
| `IP_HASH_SECRET` | `changeme`    | Secret for hashing IP addresses in rate limits — set a real random value in production |
| `HOST`           | `0.0.0.0`     | Server bind address                                                                    |
| `PORT`           | `4321`        | Server port                                                                            |
