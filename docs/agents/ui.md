# UI — agent reference

## Dashboard (`app/page.tsx`)

- **Views**: `table` (default) | `calendar` | `timetable` — `DashboardView` in `lib/booking-types.ts`
- **Shell**: `components/dashboard/top-bar.tsx`, `booking-toolbar.tsx`, `booking-tabs.tsx`, `filter-summary.tsx`, `bookings-pagination.tsx`
- **Mutations**: `hooks/use-bookings.ts` with `refetchActiveView` after changes

## Create / edit booking

| File | Role |
|------|------|
| `components/booking-dialog.tsx` | Form: single day or date range; split layout with availability panel |
| `components/booking-room-availability-panel.tsx` | Busy/free room list for selected slot |
| `components/date-range-picker.tsx` | Toolbar + inline range picker (Field + Popover + Calendar) |
| `hooks/use-room-availability.ts` | Debounced `GET /api/bookings/availability` |

Dialog layout: form left (~640px fluid), **Room status** panel right (`280px`) on `sm+`; panel stacks below times on mobile.

## Table view

| File | Role |
|------|------|
| `components/booking-views.tsx` | `BookingsTable`, typed column filters, sort |
| `lib/booking-display.ts` | `TableColumnFilterState`, `computeDisplayedBookings` |
| `hooks/use-bookings-table.ts` | Server query state |

Column filters: date range, time bounds, group text, room select, status select.

## Calendar view

| File | Role |
|------|------|
| `components/booking-calendar.tsx` | Wrapper around vendored `calendar/` |
| `calendar/` | big-calendar fork (month/week/day/year/agenda) |
| `lib/calendar-mapping.ts` | `bookingToEvent` |
| `lib/calendar-range.ts` | Visible range for fetches |

Drag-drop reschedule → `PUT /api/bookings/[id]`.

## shadcn / UI primitives

- Config: `components.json` (style: `new-york`)
- Install: `npx shadcn@latest add <component> --yes`
- Do **not** hand-write `components/ui/*` when a registry component exists
- `date-picker` block is **not** in registry; use `date-range-picker.tsx` + `Calendar` `mode="range"`

## Rooms display

Colors/badges: `lib/rooms.ts` (`ROOM_BADGE_COLORS`, `getRoomBadgeColor`).

## Details & duplicate

`components/booking-details-dialog.tsx` — read-only view; **Book again (next week)** copies room/time/group/purpose via `lib/duplicate-booking.ts`.

Table row actions include the same duplicate button (copy icon). Opens create dialog prefilled +7 days.

## Kiosk display

`app/kiosk/page.tsx` — public hallway/TV view (no login). Polls `GET /api/kiosk/status` every 30s. Allowed in `middleware.ts` alongside `/api/kiosk`.

## Mobile responsiveness

Breakpoints follow Tailwind defaults. Primary hook: `hooks/use-media-query.ts` (`useIsMobile` = below `sm` / 640px).

| View | Mobile (`< md` or `< sm`) | Desktop |
|------|---------------------------|---------|
| **Table** | Card list (`BookingsCardList` in `booking-views.tsx`); column filters desktop-only | Full HTML table with sort/filter headers |
| **Timetable** | Room `Select` + single-room vertical hour timeline | Multi-room grid (`min-w-[900px]`, horizontal scroll) |
| **Calendar** | Defaults to **Agenda**; header shows Day + Agenda only; week/month/year auto-fallback to agenda | User-chosen view (month default); all view buttons |
| **Dashboard tabs** | Scrollable `TabsList`; abbreviated labels (`Cal` / `Time`) | Full labels |
| **Pagination** | Prev / Next + “Page X of Y” | Full page-number controls |

Shell (`top-bar`, `booking-toolbar`, dialogs) stacks with `flex-col` → `sm:flex-row`. Viewport meta in `app/layout.tsx`.

## When changing UI

- Match existing Tailwind + shadcn patterns in sibling components
- Keep booking form validation in `booking-dialog.tsx` (`validateForm`)
- Availability must stay in sync with server conflict checks in `lib/db.ts`
- When adding data-dense views, provide a mobile-native layout (cards or stacked timeline), not only `overflow-x-auto`
