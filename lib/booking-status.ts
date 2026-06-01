import { format, parseISO } from "date-fns";

import type { Booking } from "@/lib/booking-types";
import {
  computeBookingStatusLabel,
  type BookingStatusLabel,
} from "@/lib/booking-status-label";

export type { BookingStatusLabel };
export { computeBookingStatusLabel };

export function formatBookingDate(dateString: string): string {
  try {
    return format(new Date(dateString), "PPP");
  } catch {
    return dateString;
  }
}

export function formatBookingTime(timeString: string): string {
  try {
    const [hours, minutes] = timeString.split(":");
    const hour = Number.parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
}

export function getBookingStatus(booking: Booking) {
  const label = computeBookingStatusLabel(booking);
  switch (label) {
    case "Upcoming":
      return { label, color: "bg-chart-5/15 text-chart-5" };
    case "In Progress":
      return {
        label,
        color:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
      };
    case "Completed":
      return { label, color: "bg-muted text-muted-foreground" };
    default:
      return { label: "Unknown", color: "bg-muted text-muted-foreground" };
  }
}

export function getTodayBookingsCount(bookings: Booking[]): number {
  const today = new Date().toISOString().split("T")[0];
  return bookings.filter((b) => b.date === today).length;
}
