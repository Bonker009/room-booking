"use client";

import { useMemo, useState } from "react";

import { CalendarProvider } from "@/calendar/contexts/calendar-context";
import { ClientContainer } from "@/calendar/components/client-container";
import { bookingsToEvents, eventToBookingPatch, slotToFormDefaults } from "@/lib/calendar-mapping";

import type { Booking } from "@/lib/db";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";

export interface BookingCalendarSlotPrefill {
  date: Date;
  startTime: string;
  endTime: string;
}

interface BookingCalendarProps {
  bookings: Booking[];
  onEventUpdate: (event: IEvent) => Promise<void>;
  onAddBooking: () => void;
  onSlotClick: (prefill: BookingCalendarSlotPrefill) => void;
  onViewBooking: (bookingId: string) => void;
  onEditBooking: (bookingId: string) => void;
  onVisibleRangeChange?: (startDate: string, endDate: string) => void;
}

export function BookingCalendar({
  bookings,
  onEventUpdate,
  onAddBooking,
  onSlotClick,
  onViewBooking,
  onEditBooking,
  onVisibleRangeChange,
}: BookingCalendarProps) {
  const [calendarView, setCalendarView] = useState<TCalendarView>("month");

  const events = useMemo(() => bookingsToEvents(bookings), [bookings]);

  const users = useMemo(() => {
    const map = new Map<string, IUser>();
    for (const booking of bookings) {
      const id = booking.bookedByEmail ?? booking.id;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: booking.bookedBy ?? "Unknown",
          picturePath: null,
        });
      }
    }
    return Array.from(map.values());
  }, [bookings]);

  return (
    <CalendarProvider
      users={users}
      events={events}
      calendarView={calendarView}
      onCalendarViewChange={setCalendarView}
      onEventUpdate={onEventUpdate}
      onAddBooking={onAddBooking}
      onViewBooking={onViewBooking}
      onEditBooking={onEditBooking}
      onVisibleRangeChange={onVisibleRangeChange}
      onSlotClick={(date, hour, minute) => {
        const defaults = slotToFormDefaults(date, hour, minute);
        onSlotClick({
          date: defaults.date,
          startTime: defaults.startTime,
          endTime: defaults.endTime,
        });
      }}
    >
      <ClientContainer view={calendarView} />
    </CalendarProvider>
  );
}

export { eventToBookingPatch };
