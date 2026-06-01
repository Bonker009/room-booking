import { format, parseISO } from "date-fns";

import type { IEvent } from "@/calendar/interfaces";
import type { Booking } from "@/lib/db";
import { ROOM_COLORS } from "@/lib/rooms";

export function bookingToEvent(booking: Booking): IEvent {
  return {
    id: booking.id,
    startDate: `${booking.date}T${booking.startTime}:00`,
    endDate: `${booking.date}T${booking.endTime}:00`,
    title: booking.groupName,
    description: booking.purpose,
    color: ROOM_COLORS[booking.className] ?? "blue",
    room: booking.className,
    user: {
      id: booking.bookedByEmail ?? booking.id,
      name: booking.bookedBy ?? "Unknown",
      picturePath: null,
    },
  };
}

export function bookingsToEvents(bookings: Booking[]): IEvent[] {
  return bookings.map(bookingToEvent);
}

export function eventToBookingPatch(event: IEvent): {
  date: string;
  startTime: string;
  endTime: string;
} {
  const start = parseISO(event.startDate);
  const end = parseISO(event.endDate);

  return {
    date: format(start, "yyyy-MM-dd"),
    startTime: format(start, "HH:mm"),
    endTime: format(end, "HH:mm"),
  };
}

export function slotToFormDefaults(date: Date, hour?: number, minute?: number) {
  const startHour = hour ?? 9;
  const startMinute = minute ?? 0;
  const endHour = startMinute >= 30 ? startHour + 1 : startHour;
  const endMinute = startMinute >= 30 ? 0 : 30;

  return {
    date,
    startTime: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
    endTime: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`,
  };
}
