# Docker — agent reference

## Files

- `Dockerfile` — multi-stage Next.js **standalone** build, Node 22 Alpine, native build for `better-sqlite3`
- `docker-compose.yml` — service `kshrd-booking-room`, container name `kshrd-booking-room`

## Runtime

| Setting | Value |
|---------|--------|
| Container port | `3000` |
| Host bind | `127.0.0.1:9999:3000` |
| Env file | `.env` (compose `env_file`) |
| Data volume | `./data` → `/app/data` (persists `auth.db`, `bookings.db`, legacy `bookings.json`) |

Both SQLite files survive container rebuilds when the volume is mounted.

## Build & run

```bash
docker compose up -d --build
```

App URL (default): `http://127.0.0.1:9999`

## Production env

Set in `.env` used by compose:

- `BETTER_AUTH_URL=http://127.0.0.1:9999` (must match user-facing origin)
- `BETTER_AUTH_SECRET`, `KEYCLOAK_*` as in `.env.example`
- Keycloak redirect: `{BETTER_AUTH_URL}/api/auth/oauth2/callback/keycloak`

## Image build notes

- `next.config.ts`: `output: "standalone"`
- Build runs Better Auth migrate (creates/updates `data/auth.db` in image)
- `.dockerignore` excludes `node_modules`, `.next`, `.env*.local`

## Stop / replace old container

```bash
docker compose down
# or
docker stop kshrd-booking-room
```

When changing Docker contracts, update **`README.md`**, **`AGENTS.md`**, and this file.
