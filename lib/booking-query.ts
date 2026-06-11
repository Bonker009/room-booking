import type { BookingQuery } from "@/lib/db";

export type BookingTab = "today" | "upcoming" | "past" | "all" | "mine";

export type BookingSortColumn =
  | "date"
  | "time"
  | "group"
  | "room"
  | "status"
  | "createdAt"
  | "className";

export interface ParsedBookingsQuery extends BookingQuery {
  search?: string;
  tab?: BookingTab;
  startTimeFrom?: string;
  endTimeBy?: string;
  statusLabel?: string;
  groupFilter?: string;
  roomExact?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function parseBookingsSearchParams(
  searchParams: URLSearchParams,
): ParsedBookingsQuery {
  const pageStr = searchParams.get("page");
  const limitStr = searchParams.get("limit");

  const query: ParsedBookingsQuery = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    className: searchParams.get("className") || undefined,
    groupName: searchParams.get("groupName") || undefined,
    search: searchParams.get("search") || undefined,
    tab: (searchParams.get("tab") as BookingTab) || undefined,
    startTimeFrom: searchParams.get("startTimeFrom") || undefined,
    endTimeBy: searchParams.get("endTimeBy") || undefined,
    statusLabel: searchParams.get("statusLabel") || undefined,
    groupFilter: searchParams.get("groupFilter") || undefined,
    roomExact: searchParams.get("roomExact") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined,
    bookedByEmailExact: searchParams.get("bookedByEmail") || undefined,
    recordStatus:
      (searchParams.get("recordStatus") as ParsedBookingsQuery["recordStatus"]) ||
      undefined,
    sortBy:
      (searchParams.get("sortBy") as ParsedBookingsQuery["sortBy"]) ||
      undefined,
    sortOrder:
      (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
  };

  if (pageStr && limitStr) {
    query.page = Number.parseInt(pageStr, 10);
    query.limit = Number.parseInt(limitStr, 10);
  }

  return query;
}

export function hasBookingsQueryParams(
  query: ParsedBookingsQuery,
): boolean {
  return Object.entries(query).some(
    ([, val]) => val !== undefined && val !== "",
  );
}

export function buildBookingsQueryString(
  params: Record<string, string | number | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      sp.set(key, String(value));
    }
  }
  return sp.toString();
}
