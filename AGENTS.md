# Agent memory — room-booking

Canonical context for Cursor agents and automation. Keep this file accurate when auth, APIs, data paths, or env contracts change.

## Purpose

- **KSHRD Room Booking System**: Next.js dashboard for room reservations (calendar + table views).
- **Auth**: Keycloak OIDC via **Better Auth**; SQLite at `data/auth.db`.
- **Data**: Bookings in SQLite **`data/bookings.db`** (`lib/bookings-store.ts`); import from legacy `data/bookings.json` via auto-migrate on first run or **`npm run migrate:bookings`**.

## Agent docs (read by topic)

| Doc | When to use |
|-----|-------------|
| [docs/agents/bookings.md](docs/agents/bookings.md) | APIs, `lib/db.ts`, conflicts, availability, bulk range |
| [docs/agents/auth.md](docs/agents/auth.md) | Keycloak, sessions, middleware, roles |
| [docs/agents/ui.md](docs/agents/ui.md) | Dashboard, dialogs, table, calendar, shadcn |
| [docs/agents/docker.md](docs/agents/docker.md) | Dockerfile, compose, production env |

## Project skills (`.cursor/skills/`)

| Skill | Trigger |
|-------|---------|
| `room-booking-add-feature` | New booking UI/API behavior |
| `room-booking-shadcn` | Adding or updating UI primitives |
| `room-booking-docker` | Container build/deploy |

## Cursor rules (`.cursor/rules/`)

- `project-context.mdc` — always on; points here + README
- `bookings-api.mdc` — `app/api/bookings/**`, `lib/db.ts`
- `booking-ui.mdc` — booking components, hooks, calendar
- `auth-session.mdc` — auth, middleware, sign-in

## Quick file map

| Area | Primary paths |
|------|----------------|
| Dashboard shell | `app/page.tsx`, `components/dashboard/*` |
| Create/edit booking | `components/booking-dialog.tsx`, `hooks/use-room-availability.ts`, `components/booking-room-availability-panel.tsx` |
| Table | `components/booking-views.tsx`, `lib/booking-display.ts`, `hooks/use-bookings-table.ts` |
| Calendar | `components/booking-calendar.tsx`, `calendar/`, `lib/calendar-mapping.ts` |
| Bookings API | `app/api/bookings/**`, `lib/db.ts`, `lib/bookings-store.ts`, `lib/booking-query.ts` |
| Kiosk (public) | `app/kiosk/page.tsx`, `app/api/kiosk/status/route.ts` |
| Duplicate booking | `lib/duplicate-booking.ts`, table/details “Book again” actions |
| My bookings / CSV | Table tab `mine`; `GET /api/bookings/export` |
| Series edit/delete | `?scope=series` on PUT/DELETE; dialog + table UI |
| Timetable view | `components/room-timetable.tsx`, dashboard view `timetable` |
| Booking rules | `lib/booking-rules.ts`, `lib/booking-api-helpers.ts` |
| Admin | `/admin`, `GET /api/admin/stats`, `GET /api/admin/pending`, `POST /api/bookings/[id]/approve` |
| Notifications | `lib/notifications.ts` — optional `BOOKING_NOTIFY_WEBHOOK` |
| Auth | `lib/auth.ts`, `middleware.ts`, `lib/require-session.ts`, `lib/session-roles.ts` |
| Rooms | `lib/rooms.ts` (`ROOM_OPTIONS`, badge colors) |

## Environment (minimal)

Copy `.env.example` → `.env.local` (dev) or `.env` (Docker).

- `BETTER_AUTH_SECRET` (≥32 chars prod), `BETTER_AUTH_URL` (no trailing slash)
- `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER`
- Keycloak redirect: `{BETTER_AUTH_URL}/api/auth/oauth2/callback/keycloak`

## Conventions

- OAuth provider id: **`keycloak`**
- Booking APIs: **401** without session (`requireApiSession`)
- `bookedBy` / `bookedByEmail`: set **server-side** from session, not request body
- Edit/delete: owner email match or Keycloak role **`role_admin`** (`lib/session-roles.ts`)
- UI components: prefer **`npx shadcn@latest add <name>`** over hand-rolling `components/ui/*`
- After Better Auth schema changes: `npx @better-auth/cli@latest migrate --config lib/auth.ts --yes`
- Next.js 16 may warn **middleware → proxy**; `middleware.ts` still valid until migrated

## Do not assume

- README alone; use **this file** + topic docs + `README.md`
- `/kshrd-logo.png` exists in `public/` until provided
- `date-picker` exists in shadcn registry (use `components/date-range-picker.tsx` + `Calendar` `mode="range"`)

## Human docs

Setup and Keycloak steps: **`README.md`**.
