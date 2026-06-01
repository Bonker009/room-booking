import { format } from "date-fns";

import type { DateRangeValue } from "@/components/date-range-picker";
import type { Booking } from "@/lib/booking-types";

export interface BookingFilterParams {
  bookings: Booking[];
  filter: string;
  dateRangeFilter?: DateRangeValue;
  roomFilter: string;
  activeTab: string;
}

export function filterBookingsList({
  bookings,
  filter,
  dateRangeFilter,
  roomFilter,
  activeTab,
}: BookingFilterParams): Booking[] {
  let filtered = bookings;

  if (filter) {
    filtered = filtered.filter((b) =>
      [
        b.date,
        b.startTime,
        b.endTime,
        b.groupName,
        b.className,
        b.bookedBy,
        b.bookedByEmail,
        b.purpose,
      ]
        .filter(Boolean)
        .some((val) =>
          String(val).toLowerCase().includes(filter.toLowerCase()),
        ),
    );
  }

  const hasToolbarDateRange = Boolean(
    dateRangeFilter?.from || dateRangeFilter?.to,
  );

  if (hasToolbarDateRange) {
    const fromIso = dateRangeFilter?.from
      ? format(dateRangeFilter.from, "yyyy-MM-dd")
      : undefined;
    const toIso = dateRangeFilter?.to
      ? format(dateRangeFilter.to, "yyyy-MM-dd")
      : undefined;
    filtered = filtered.filter((b) => {
      if (fromIso && toIso) return b.date >= fromIso && b.date <= toIso;
      if (fromIso) return b.date >= fromIso;
      if (toIso) return b.date <= toIso;
      return true;
    });
  }

  if (roomFilter) {
    filtered = filtered.filter((b) => b.className === roomFilter);
  }

  if (!hasToolbarDateRange) {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (activeTab === "today") {
      filtered = filtered.filter((b) => b.date === todayStr);
    } else if (activeTab === "upcoming") {
      filtered = filtered.filter((b) => {
        if (b.date > todayStr) return true;
        if (b.date < todayStr) return false;
        const [endHour, endMin] = b.endTime.split(":").map(Number);
        const bookingEnd = new Date(b.date);
        bookingEnd.setHours(endHour, endMin, 0, 0);
        return bookingEnd > now;
      });
    } else if (activeTab === "past") {
      filtered = filtered.filter((b) => {
        if (b.date < todayStr) return true;
        if (b.date > todayStr) return false;
        const [endHour, endMin] = b.endTime.split(":").map(Number);
        const bookingEnd = new Date(b.date);
        bookingEnd.setHours(endHour, endMin, 0, 0);
        return bookingEnd <= now;
      });
    }
  }

  return [...filtered].sort((a, b) => {
    const dateComparison = a.date.localeCompare(b.date);
    if (dateComparison !== 0) return dateComparison;
    return a.startTime.localeCompare(b.startTime);
  });
}
