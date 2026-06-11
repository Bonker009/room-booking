---
name: room-booking-docker
description: >-
  Build and run the room-booking app in Docker. Use when changing Dockerfile,
  docker-compose, standalone output, or production env for container deploy.
---

# Room booking — Docker

Read **`docs/agents/docker.md`** first.

## Layout

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage standalone Next.js build |
| `docker-compose.yml` | Service `kshrd-booking-room`, port `127.0.0.1:9999:3000` |
| `next.config.ts` | `output: "standalone"` |

## Build & run

```bash
docker compose up -d --build
```

Open `http://127.0.0.1:9999` (or whatever `BETTER_AUTH_URL` is set to).

## Env (`.env` for compose)

- `BETTER_AUTH_URL` must match the browser origin (including port `9999`)
- `BETTER_AUTH_SECRET`, `KEYCLOAK_*` per `.env.example`
- Keycloak redirect: `{BETTER_AUTH_URL}/api/auth/oauth2/callback/keycloak`

## Data volumes

Current compose mounts only `./data/bookings.json`. `auth.db` lives in the image unless you mount `./data:/app/data`.

## Dockerfile changes

- Keep native build deps for `better-sqlite3` (python3, make, g++)
- Build step runs Better Auth migrate against `lib/auth.ts`
- Do not copy `.env.local` — use compose `env_file: .env`

## After changes

Update `docs/agents/docker.md`, `AGENTS.md`, and `README.md` if ports, volumes, or env contracts change.

```bash
docker compose up -d --build
npm run build   # still verify local Next build if app code changed
```
