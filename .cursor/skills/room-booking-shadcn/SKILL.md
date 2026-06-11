---
name: room-booking-shadcn
description: >-
  Add or update shadcn/ui components in room-booking. Use when adding buttons,
  dialogs, popovers, fields, or other UI primitives — never hand-roll components
  that exist in the shadcn registry.
---

# Room booking — shadcn UI

## Config

- `components.json` — style `new-york`, aliases `@/components`, `@/lib/utils`
- Existing primitives live in `components/ui/`

## Add a component

```bash
npx shadcn@latest add <component-name> --yes
```

Examples already in repo: `button`, `dialog`, `popover`, `calendar`, `field`, `select`, `tabs`, `badge`, `card`, `input`, `label`, `separator`, `alert-dialog`, `sonner`.

## Date ranges

There is **no** `date-picker` block in the registry for this project.

Use:

- `components/date-range-picker.tsx` (`DateRangePicker`, `DateRangePickerInline`)
- `components/ui/calendar.tsx` with `mode="range"`

## Conventions

- Import from `@/components/ui/<name>`
- Use `cn()` from `@/lib/utils` for class merging
- Match patterns in `booking-dialog.tsx` and `components/dashboard/*`
- Do not edit generated `components/ui/*` for one-off styling — wrap in feature components instead

## Verify

```bash
npm run build
```
