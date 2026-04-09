/** Client-side column filters + sort for the bookings table. */

export interface BookingDisplayModel {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy: string;
  bookedByEmail?: string;
  purpose: string;
}

export type ColumnKey = "date" | "time" | "group" | "room" | "status";

/** Room values aligned with booking form / API. */
export const TABLE_ROOM_OPTIONS = [
  "BTB",
  "SR",
  "PP",
  "KPS",
  "PVH",
  "Seminar",
  "Koh Kong",
] as const;

/** Status labels must match `getBookingStatus` in the app. */
export const TABLE_STATUS_OPTIONS = [
  "Upcoming",
  "In Progress",
  "Completed",
] as const;

export type TableColumnFilterState = {
  date?: { from?: string; to?: string };
  time?: { startFrom?: string; endBy?: string };
  group?: string;
  /** Exact room match; omit or empty = any */
  room?: string;
  /** Exact status label; omit or empty = any */
  status?: string;
};

function includesCI(haystack: string, needle: string): boolean {
  const n = needle.trim().toLowerCase();
  if (!n) return true;
  return haystack.toLowerCase().includes(n);
}

function rowMatchesDate(
  row: BookingDisplayModel,
  spec?: { from?: string; to?: string },
): boolean {
  if (!spec?.from?.trim() && !spec?.to?.trim()) return true;
  const d = row.date;
  if (spec.from?.trim() && d < spec.from) return false;
  if (spec.to?.trim() && d > spec.to) return false;
  return true;
}

function rowMatchesTime(
  row: BookingDisplayModel,
  spec?: { startFrom?: string; endBy?: string },
): boolean {
  if (!spec?.startFrom?.trim() && !spec?.endBy?.trim()) return true;
  if (spec.startFrom?.trim() && row.startTime < spec.startFrom) return false;
  if (spec.endBy?.trim() && row.endTime > spec.endBy) return false;
  return true;
}

function rowMatchesGroup(row: BookingDisplayModel, q?: string): boolean {
  if (!q?.trim()) return true;
  return includesCI(row.groupName, q);
}

function rowMatchesRoom(row: BookingDisplayModel, room?: string): boolean {
  if (!room?.trim()) return true;
  return row.className === room;
}

function rowMatchesStatus(
  row: BookingDisplayModel,
  status: string | undefined,
  statusLabel: (row: BookingDisplayModel) => string,
): boolean {
  if (!status?.trim()) return true;
  return statusLabel(row) === status;
}

export function applyColumnFilters(
  rows: BookingDisplayModel[],
  filters: TableColumnFilterState,
  statusLabel: (row: BookingDisplayModel) => string,
): BookingDisplayModel[] {
  return rows.filter(
    (row) =>
      rowMatchesDate(row, filters.date) &&
      rowMatchesTime(row, filters.time) &&
      rowMatchesGroup(row, filters.group) &&
      rowMatchesRoom(row, filters.room) &&
      rowMatchesStatus(row, filters.status, statusLabel),
  );
}

export function columnFiltersActive(filters: TableColumnFilterState): boolean {
  if (filters.date?.from?.trim() || filters.date?.to?.trim()) return true;
  if (filters.time?.startFrom?.trim() || filters.time?.endBy?.trim())
    return true;
  if (filters.group?.trim()) return true;
  if (filters.room?.trim()) return true;
  if (filters.status?.trim()) return true;
  return false;
}

function compare(
  a: BookingDisplayModel,
  b: BookingDisplayModel,
  column: ColumnKey,
  dir: "asc" | "desc",
  statusLabel: (row: BookingDisplayModel) => string,
): number {
  let primary = 0;
  switch (column) {
    case "date":
      primary = a.date.localeCompare(b.date);
      if (primary === 0) primary = a.startTime.localeCompare(b.startTime);
      break;
    case "time":
      primary = a.startTime.localeCompare(b.startTime);
      if (primary === 0) primary = a.endTime.localeCompare(b.endTime);
      if (primary === 0) primary = a.date.localeCompare(b.date);
      break;
    case "group":
      primary = a.groupName.localeCompare(b.groupName, undefined, {
        sensitivity: "base",
      });
      break;
    case "room":
      primary = a.className.localeCompare(b.className, undefined, {
        sensitivity: "base",
      });
      break;
    case "status":
      primary = statusLabel(a).localeCompare(statusLabel(b), undefined, {
        sensitivity: "base",
      });
      break;
    default:
      primary = 0;
  }
  return dir === "asc" ? primary : -primary;
}

export function sortBookings(
  rows: BookingDisplayModel[],
  column: ColumnKey | null,
  dir: "asc" | "desc",
  statusLabel: (row: BookingDisplayModel) => string,
): BookingDisplayModel[] {
  if (!column) return [...rows];
  return [...rows].sort((a, b) => compare(a, b, column, dir, statusLabel));
}

export function computeDisplayedBookings(
  filteredRows: BookingDisplayModel[],
  columnFilters: TableColumnFilterState,
  sortColumn: ColumnKey | null,
  sortDirection: "asc" | "desc",
  statusLabel: (row: BookingDisplayModel) => string,
): BookingDisplayModel[] {
  const afterFilter = applyColumnFilters(
    filteredRows,
    columnFilters,
    statusLabel,
  );
  return sortBookings(afterFilter, sortColumn, sortDirection, statusLabel);
}

/** 30-minute slots 00:00–23:30 for time filter selects (HH:mm). */
export function getTableTimeSlotOptions(): { value: string; label: string }[] {
  return Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    const hour12 = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    const label = `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
    return { value, label };
  });
}
