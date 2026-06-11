---
name: room-booking-add-feature
description: >-
  Add or change booking features in the KSHRD room-booking app. Use when
  implementing new booking UI, API behavior, filters, calendar actions, or
  availability logic.
---

# Room booking — add feature

## Before coding

1. Read **`AGENTS.md`** and the matching topic doc:
   - API/data → `docs/agents/bookings.md`
   - UI → `docs/agents/ui.md`
   - Auth → `docs/agents/auth.md`
2. Read the files you will touch (see topic doc file map).

## API changes

1. Implement in `lib/db.ts` and/or `app/api/bookings/**`.
2. Guard with `requireApiSession()`; set `bookedBy` / `bookedByEmail` from session.
3. Reuse `findConflictingBooking` / `checkBookingConflicts` for overlap rules.
4. If list contract changes: update `lib/booking-query.ts`, `lib/booking-filters.ts`, `hooks/use-bookings-table.ts`.
5. Update `docs/agents/bookings.md` and `AGENTS.md` for new public params/fields.

## UI changes

1. Prefer extending `booking-dialog.tsx`, `booking-views.tsx`, `booking-calendar.tsx`, or `components/dashboard/*`.
2. Room list and colors: `lib/rooms.ts` only.
3. Availability side panel: `hooks/use-room-availability.ts` + `booking-room-availability-panel.tsx`.
4. After mutations, ensure `app/page.tsx` refetches via `refetchActiveView`.

## Verify

```bash
npm run build
```

Pre-existing lint issues in `calendar/` may remain; build is the gate for new work.

## Do not

- Add client-supplied `bookedBy` / `bookedByEmail`.
- Store bookings outside `data/bookings.json`.
- Reintroduce grid view unless explicitly requested.
