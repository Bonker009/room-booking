# Agent memory — room-booking

Use this file as the **canonical project context** for assistants and automation. Keep it accurate when auth, data paths, or env contracts change.

## Purpose

- **KSHRD Room Booking System**: Next.js dashboard for room reservations.
- **Auth**: Users must sign in via **Keycloak** (`keycloak.kshrd.app`); app uses **Better Auth** with SQLite at `data/auth.db`.
- **Data**: Bookings live in **`data/bookings.json`** (not a SQL DB).

## Do not assume

- README boilerplate alone; use **`README.md`** (this repo) and **`AGENTS.md`** for behavior.
- Logo path `/kshrd-logo.png` may be missing from `public/` until provided.

## Files to read before changes

| Task | Read first |
|------|------------|
| Auth / login / session | `lib/auth.ts`, `lib/auth-client.ts`, `middleware.ts`, `app/sign-in/page.tsx` |
| Protecting routes or APIs | `middleware.ts`, `lib/require-session.ts` |
| Bookings CRUD / conflicts | `lib/db.ts`, `app/api/bookings/route.ts`, `app/api/bookings/[id]/route.ts` |
| Main UI | `app/page.tsx`, `components/booking-*.tsx`, `components/booking-views.tsx`, `lib/booking-display.ts` |

## Environment (minimal)

- `BETTER_AUTH_SECRET` (≥32 chars in prod), `BETTER_AUTH_URL` (no trailing slash).
- `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` (`https://keycloak.kshrd.app/realms/<realm>`).
- Keycloak **redirect URI**: `{BETTER_AUTH_URL}/api/auth/oauth2/callback/keycloak`.
- Copy from **`.env.example`** → `.env.local`.

## Conventions

- OAuth provider id for Keycloak: **`keycloak`** (Better Auth Generic OAuth).
- Booking APIs return **401** without session (`requireApiSession` in `lib/require-session.ts`). `bookedBy` / `bookedByEmail` are set server-side from the Keycloak/Better Auth session, not from the request body.
- After schema changes for Better Auth, run: `npx @better-auth/cli@latest migrate --config lib/auth.ts --yes`.

## Next.js notes

- Build may warn about **middleware → proxy** (Next.js 16); `middleware.ts` is still valid until migrated.
