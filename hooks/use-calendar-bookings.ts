"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { Booking } from "@/lib/booking-types";
import { buildBookingsQueryString } from "@/lib/booking-query";
import type { CalendarVisibleRange } from "@/lib/calendar-range";

export function useCalendarBookings(range: CalendarVisibleRange | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!range) return;
    setIsLoading(true);
    try {
      const qs = buildBookingsQueryString({
        startDate: range.startDate,
        endDate: range.endDate,
        tab: "all",
      });
      const res = await fetch(`/api/bookings?${qs}`);
      if (!res.ok) {
        toast.error("Error fetching calendar bookings");
        return;
      }
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : data.bookings ?? []);
    } catch {
      toast.error("Network error", {
        description: "Could not load calendar bookings",
      });
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  return { bookings, isLoading, refetch: fetchBookings };
}

export function useTodayBookingsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const qs = buildBookingsQueryString({
          tab: "today",
          page: 1,
          limit: 1,
        });
        const res = await fetch(`/api/bookings?${qs}`);
        if (res.ok) {
          const data = await res.json();
          setCount(typeof data.total === "number" ? data.total : 0);
        }
      } catch {
        setCount(0);
      }
    })();
  }, []);

  const refetch = useCallback(async () => {
    const qs = buildBookingsQueryString({ tab: "today", page: 1, limit: 1 });
    const res = await fetch(`/api/bookings?${qs}`);
    if (res.ok) {
      const data = await res.json();
      setCount(typeof data.total === "number" ? data.total : 0);
    }
  }, []);

  return { count, refetch };
}
