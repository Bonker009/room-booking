# Room Booking System (KSHRD)

Internal **room booking** dashboard: browse, create, edit, and delete reservations. The UI is a single Next.js app; booking data is stored in JSON; **sessions and users** use **Better Auth** with **SQLite** and **Keycloak** (OIDC) for login.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **Better Auth** + **better-sqlite3** (`data/auth.db`)
- **Keycloak** at `keycloak.kshrd.app` via the Generic OAuth plugin (`providerId`: `keycloak`)
- Bookings persisted in **`data/bookings.json`** (`lib/db.ts`)
- **Calendar views** (month, week, day, year, agenda) via vendored `calendar/` module ([big-calendar](https://github.com/lramos33/big-calendar)), with drag-and-drop reschedule
- **Multi-day bookings**: one JSON record per day, linked by optional `seriesId`

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
2. User clicks **Continue with Keycloak** → Better Auth starts OAuth2 with `providerId: "keycloak"`.
3. After Keycloak redirects back, Better Auth creates a session cookie.
4. Booking **API routes** additionally verify the session server-side (`lib/require-session.ts`).

### Environment variables (auth)

| Variable | Purpose |
|----------|---------|
| `BETTER_AUTH_SECRET` | Encryption/signing; **≥ 32 characters** in production (`openssl rand -base64 32`). |
| `BETTER_AUTH_URL` | Public base URL of **this** app, no trailing slash (e.g. `http://localhost:3000`). Must match the browser origin users use. |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Optional; comma-separated extra allowed origins for cookies/CSRF. |
| `KEYCLOAK_CLIENT_ID` | Keycloak client ID. |
| `KEYCLOAK_CLIENT_SECRET` | Keycloak client secret (confidential client). |
| `KEYCLOAK_ISSUER` | Full realm issuer URL, e.g. `https://keycloak.kshrd.app/realms/<realm>`. |

### Keycloak client settings

In the Keycloak admin console, for the client used by this app:

- **Valid redirect URIs:** `{BETTER_AUTH_URL}/api/auth/oauth2/callback/keycloak`  
  Example: `http://localhost:3000/api/auth/oauth2/callback/keycloak`
- **Web origins:** your app origin (e.g. `http://localhost:3000`).

### Important files

| Path | Role |
|------|------|
| `lib/auth.ts` | Better Auth server config (SQLite path, Keycloak plugin, `nextCookies()`). |
| `lib/auth-client.ts` | Browser client + `genericOAuthClient()` plugin. |
| `app/api/auth/[...all]/route.ts` | Auth HTTP handler (`toNextJsHandler`). |
| `middleware.ts` | Redirect unauthenticated users to `/sign-in`. |
| `app/sign-in/page.tsx` | Keycloak sign-in button. |

## API (bookings)

All booking endpoints require an authenticated session (cookie).

- `GET /api/bookings` — list with optional query params. With any filter param, returns `{ bookings, total, page, limit, totalPages }`. Without params, returns a plain array (legacy).
  - **Date range (calendar):** `startDate`, `endDate` (ISO `yyyy-MM-dd`)
  - **Table search:** `search` (free text), `tab` (`today|upcoming|past|all`), `roomExact`, `startDate`/`endDate` (toolbar range)
  - **Column filters:** `dateFrom`, `dateTo`, `startTimeFrom`, `endTimeBy`, `groupFilter`, `statusLabel`
  - **Sort/pagination:** `sortBy` (`date|time|group|room|status|createdAt|className`), `sortOrder`, `page`, `limit`
- `GET /api/bookings/availability` — per-room free/busy for a slot: `date`, `startTime`, `endTime`, optional `excludeId` (edit mode).
- `POST /api/bookings` — create single-day booking (validates fields; checks room/time conflicts).
- `POST /api/bookings/bulk` — create a **date-range** booking (same room/time each day; one record per day; returns created + conflict summary; HTTP 207 on partial success).
- `GET/PUT/DELETE /api/bookings/[id]` — read, update, delete.

**Rooms** are defined in `lib/rooms.ts`. The dashboard defaults to the **Calendar** view (fetches only the visible date range); switch to **Table** for server-driven search, filters, sort, and pagination.

Implementation: `app/api/bookings/**/*.ts`, storage `lib/db.ts`, calendar mapping `lib/calendar-mapping.ts`.

## Docker

- `docker-compose.yml` maps **`./data`** → `/app/data` so **`bookings.json`** and **`auth.db`** persist.
- Set the same auth-related env vars at runtime (especially `BETTER_AUTH_URL` to match how users reach the app, e.g. `http://127.0.0.1:9999` if exposed on port 9999).
- The `Dockerfile` installs build tools for `better-sqlite3` and runs Better Auth migrate after `npm run build`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack). |
| `npm run build` | Production build. |
| `npm run start` | Start production server. |
| `npm run lint` | ESLint. |

## Agent / contributor note

For a short architecture and “what to touch” guide for automation, see **`AGENTS.md`**.
