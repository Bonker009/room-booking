# Bookings — agent reference

## Storage

- SQLite: `data/bookings.db` (WAL mode)
- Layer: `lib/bookings-store.ts` (CRUD, conflict SQL)
- API/logic: `lib/db.ts` (filters, range/recurring, kiosk status)
- Types: `lib/booking-model.ts` → re-exported from `lib/booking-types.ts`
- **Migration**: on first app open, if DB is empty and `data/bookings.json` exists, records are imported once (JSON kept as backup)
- **Manual script**: `npm run migrate:bookings` — logic in `lib/migrate-bookings-json.ts`
  - `--merge` (default): insert new ids only
  - `--replace`: wipe DB table, reimport all from JSON
  - `--if-empty`: import only when DB has zero rows
  - `--dry-run`: preview counts without writing

## Public kiosk API (no session)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/kiosk/status` | Today’s per-room busy/free + next booking; used by `/kiosk` |

Logic: `getKioskRoomStatuses()` in `lib/db.ts`.

## Conflict rule

Same `date` + `className` (room) + overlapping times:

`newStart < existingEnd && newEnd > existingStart` (HH:mm string compare).

## API routes (all require session)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/bookings` | List; with filters → `{ bookings, total, page, limit, totalPages }`; bare GET → array (legacy) |
| GET | `/api/bookings/availability` | `date`, `startTime`, `endTime`, optional `excludeId` → per-room free/busy + `conflict` summary |
| POST | `/api/bookings` | Single-day create |
| POST | `/api/bookings/bulk` | Range: one record/day, shared `seriesId`; HTTP 207 partial success |
| GET/PUT/DELETE | `/api/bookings/[id]` | Read, update, delete |

Query parsing: `lib/booking-query.ts`. Server filters/sort: `lib/booking-filters.ts`.

### GET `/api/bookings` params (table)

- Tabs: `tab` = `today|upcoming|past|all`
- Search: `search`
- Toolbar range: `startDate`, `endDate`, `roomExact`
- Column filters: `dateFrom`, `dateTo`, `startTimeFrom`, `endTimeBy`, `groupFilter`, `statusLabel`
- Sort: `sortBy`, `sortOrder`; pagination: `page`, `limit`

### Calendar fetch

`startDate` + `endDate` only (visible range). Hook: `hooks/use-calendar-bookings.ts`.

## Client hooks

| Hook | Role |
|------|------|
| `use-bookings.ts` | Create, edit, delete, calendar drag update |
| `use-bookings-table.ts` | Server-driven table state + fetch |
| `use-room-availability.ts` | Debounced availability for booking dialog; range aggregation |

## Room list

Single source: `lib/rooms.ts` → `ROOM_OPTIONS`. Add a room there and in API validation if needed.

## When changing bookings

1. Update `lib/db.ts` and relevant route under `app/api/bookings/`
2. If query contract changes, update `lib/booking-query.ts` + `hooks/use-bookings-table.ts`
3. Update `AGENTS.md` / this file if new params or fields are public contract
