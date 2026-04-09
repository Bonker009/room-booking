# Agent memory — room-booking

Use this file as the **canonical project context** for assistants and automation. Keep it accurate when auth, data paths, or env contracts change.

## Purpose

- **KSHRD Room Booking System**: Next.js dashboard for room reservations.
- **Auth**: Keycloak OIDC (`keycloak.kshrd.app`) via Better Auth Generic OAuth (`providerId: **keycloak**`); sessions/users in SQLite **`data/auth.db`**.
- **Data**: Bookings in **`data/bookings.json`** via **`lib/db.ts`** (not a SQL DB).

## Do not assume

- Generic Next.js README; use **`README.md`** and **`AGENTS.md`** for this repo.
- **`/kshrd-logo.png`** may be missing from `public/` until added.
- Client bundles do **not** receive non-`NEXT_PUBLIC_` env vars; production auth base URL needs **`NEXT_PUBLIC_BETTER_AUTH_URL`** aligned with **`BETTER_AUTH_URL`**.

## Files to read before changes

| Task | Read first |
|------|------------|
| Auth URL / trusted origins / prod domain | `lib/auth-public.ts`, `lib/auth.ts`, `lib/auth-client.ts` |
| Sign-in UX / redirect | `app/sign-in/page.tsx` (`disableRedirect` + `window.location.assign`, Sonner toasts) |
| Session on API / Keycloak → booking fields | `lib/require-session.ts` (`requireApiSession`, `bookingActorFromSessionUser`) |
| Route protection | `middleware.ts` |
| Bookings CRUD | `app/api/bookings/route.ts`, `app/api/bookings/[id]/route.ts`, `lib/db.ts` |
| Main UI | `app/page.tsx`, `components/booking-*.tsx`, `components/booking-views.tsx`, `lib/booking-display.ts` |

## Environment (minimal)

| Concern | Variables / notes |
|--------|-------------------|
| Secrets | `BETTER_AUTH_SECRET` (≥32 chars in prod) |
| Public app URL (no trailing slash) | **`BETTER_AUTH_URL`** — drives OAuth **`redirect_uri`** on server |
| Same URL for browser after `next build` | **`NEXT_PUBLIC_BETTER_AUTH_URL`** — must match **`BETTER_AUTH_URL`** in production; **rebuild** image/app when changed |
| Extra hostnames | `BETTER_AUTH_TRUSTED_ORIGINS` (comma-separated origins) |
| Keycloak | `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` (`https://keycloak.kshrd.app/realms/<realm>`) |
| Keycloak client | Valid redirect: `{BETTER_AUTH_URL}/api/auth/oauth2/callback/keycloak`; Web origins = app origin |

Copy from **`.env.example`** → `.env.local` for local dev.

## Conventions

- **`bookedBy`** / **`bookedByEmail`** are written **only** in API handlers from **`bookingActorFromSessionUser(session.user)`** — never trust client body for identity.
- Booking APIs: **`requireApiSession()`**; return **401** if no session.
- Schema/migration: `npx @better-auth/cli@latest migrate --config lib/auth.ts --yes`
- **Next.js 16**: `middleware.ts` may warn about **proxy**; still valid until migrated.

## Documentation contract

When auth, env, or booking identity behavior changes, update **`README.md`**, **`AGENTS.md`**, and **`.env.example`**; keep **`.cursor/rules/project-context.mdc`** aligned for Cursor agents.
