import { addDays, parseISO } from "date-fns";

import type { Booking, BookingDialogPrefill } from "@/lib/booking-types";

/** Copy booking fields to a new slot one week later (same weekday/time). */
export function buildDuplicatePrefill(booking: Booking): BookingDialogPrefill {
  const sourceDate = parseISO(`${booking.date}T12:00:00`);
  return {
    date: addDays(sourceDate, 7),
    startTime: booking.startTime,
    endTime: booking.endTime,
    groupName: booking.groupName,
    className: booking.className,
    purpose: booking.purpose,
  };
}
