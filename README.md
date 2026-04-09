# Room Booking System (KSHRD)

Internal **room booking** dashboard: browse, create, edit, and delete reservations. The UI is a single Next.js app; booking data is stored in JSON; **sessions and users** use **Better Auth** with **SQLite** and **Keycloak** (OIDC) for login.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **Better Auth** + **better-sqlite3** (`data/auth.db`)
- **Keycloak** at `keycloak.kshrd.app` via the Generic OAuth plugin (`providerId`: `keycloak`)
- Bookings persisted in **`data/bookings.json`** (`lib/db.ts`)

## Prerequisites

- Node.js 20+ (project uses npm; lockfile: `package-lock.json`)
- A **Keycloak** realm and OIDC client (see [Authentication](#authentication))

## Quick start

1. Clone the repo and install dependencies:

   ```bash
   npm ci
   ```

2. Copy environment variables and fill in secrets:

   ```bash
   cp .env.example .env.local
   ```

3. Apply Better Auth DB migrations (creates/updates `data/auth.db`):

   ```bash
   npx @better-auth/cli@latest migrate --config lib/auth.ts --yes
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000). Unauthenticated users are redirected to **`/sign-in`**.

## Authentication

Login is **Keycloak-only** (no email/password in this app). Flow:

1. User hits a protected route → `middleware.ts` checks for a session cookie; if missing → redirect to `/sign-in`.
2. User clicks **Continue with Keycloak** → client calls Better Auth `signIn.oauth2` (`providerId: "keycloak"`, `disableRedirect: true`), then **`window.location.assign`** to Keycloak (explicit redirect + toast on errors).
3. After Keycloak redirects back to `/api/auth/oauth2/callback/keycloak`, Better Auth completes the flow and sets the session cookie.
4. Booking **API routes** verify the session (`lib/require-session.ts`). **`bookedBy`** and **`bookedByEmail`** on each booking are **set only from the session** on create/update (not from the request body).

### Environment variables (auth)

| Variable | Purpose |
|----------|---------|
| `BETTER_AUTH_SECRET` | Encryption/signing; **≥ 32 characters** in production (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | Public base URL of **this** app, no trailing slash (e.g. `https://bookings.example.com`). **Must match the address users type in the browser** or OAuth redirect and the sign-in button will fail. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Set to the **same** value as `BETTER_AUTH_URL` for production/custom domains so the client calls `/api/auth` on the correct host (needed after `next build`). |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Optional; comma-separated extra allowed origins (e.g. `https://www.example.com,https://example.com`) if you use multiple hostnames. Server also trusts origins derived from `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL`. |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID. |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret (confidential client). |
| `KEYCLOAK_ISSUER` | Full realm issuer URL, e.g. `https://keycloak.kshrd.app/realms/<realm>`. |

### Keycloak client settings

In the Keycloak admin console, for the client used by this app:

- **Valid redirect URIs:** `{BETTER_AUTH_URL}/api/auth/oauth2/callback/keycloak`  
  Example: `http://localhost:3000/api/auth/oauth2/callback/keycloak`
- **Web origins:** your app origin (e.g. `http://localhost:3000`).

### Production / custom domain checklist

1. Set **`BETTER_AUTH_URL`** and **`NEXT_PUBLIC_BETTER_AUTH_URL`** to the **same** public origin (no trailing slash), e.g. `https://bookings.example.com`.
2. **Rebuild** after changing `NEXT_PUBLIC_*` (`next build` / Docker image rebuild).
3. Keycloak client: **Valid redirect URIs** and **Web origins** must use that same origin.
4. Optional: **`BETTER_AUTH_TRUSTED_ORIGINS`** for extra hostnames (e.g. `www` + apex).

### Important files

| Path | Role |
|------|------|
| `lib/auth.ts` | Better Auth server config (SQLite path, Keycloak plugin, `nextCookies()`). |
| `lib/auth-public.ts` | `getBetterAuthPublicBaseUrl()`, `buildBetterAuthTrustedOrigins()` — shared URL/origin logic for server + docs. |
| `lib/auth-client.ts` | Browser client; uses `NEXT_PUBLIC_BETTER_AUTH_URL` + `/api/auth` when set. |
| `lib/require-session.ts` | `requireApiSession()`, `bookingActorFromSessionUser()` for booking APIs. |
| `app/api/auth/[...all]/route.ts` | Auth HTTP handler (`toNextJsHandler`). |
| `middleware.ts` | Redirect unauthenticated users to `/sign-in`. |
| `app/sign-in/page.tsx` | Keycloak sign-in; manual redirect + error toasts. |

## API (bookings)

All booking endpoints require an authenticated session (cookie).

- `GET /api/bookings` — list (optional query params for filters/pagination).
- `POST /api/bookings` — create (validates fields; checks room/time conflicts).
- `GET/PUT/DELETE /api/bookings/[id]` — read, update, delete.

Implementation: `app/api/bookings/**/*.ts`, storage `lib/db.ts`.

## Docker

- `docker-compose.yml` maps **`./data`** → `/app/data` so **`bookings.json`** and **`auth.db`** persist.
- Pass **`BETTER_AUTH_URL`** and **`NEXT_PUBLIC_BETTER_AUTH_URL`** at **build** (for `NEXT_PUBLIC_*`) and/or runtime so they match the URL users use (e.g. public `https://…` behind a reverse proxy, not only `127.0.0.1:9999`).
- The `Dockerfile` installs build tools for `better-sqlite3` and runs Better Auth migrate after `npm run build`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack). |
| `npm run build` | Production build. |
| `npm run start` | Start production server. |
| `npm run lint` | ESLint. |

## Agent / contributor note

- **`AGENTS.md`** — canonical **agent memory** (files, env, conventions, doc contract).
- **`.cursor/rules/project-context.mdc`** — always-on Cursor rule pointing here and to env/auth/booking paths.
