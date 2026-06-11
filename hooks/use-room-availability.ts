"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { eachDayOfInterval, format } from "date-fns";

import type { DateRangeValue } from "@/components/date-range-picker";
import type { RoomAvailabilityItem } from "@/app/api/bookings/availability/route";
import { ROOM_OPTIONS } from "@/lib/rooms";

export type AggregatedRoomAvailability = RoomAvailabilityItem & {
  /** ISO dates where this room is busy (range mode only). */
  busyDays?: string[];
};

interface UseRoomAvailabilityParams {
  open: boolean;
  bookingMode: "single" | "range" | "recurring";
  date?: Date;
  dateRange?: DateRangeValue;
  startTime: string;
  endTime: string;
  room: string;
  excludeId?: string;
}

export function useRoomAvailability({
  open,
  bookingMode,
  date,
  dateRange,
  startTime,
  endTime,
  room,
  excludeId,
}: UseRoomAvailabilityParams) {
  const [rooms, setRooms] = useState<AggregatedRoomAvailability[]>([]);
  const [rangeConflictDays, setRangeConflictDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSingleDay = useCallback(
    async (dateStr: string) => {
      if (!startTime || !endTime || startTime >= endTime) return null;

      const params = new URLSearchParams({
        date: dateStr,
        startTime,
        endTime,
      });
      if (excludeId) params.set("excludeId", excludeId);

      const res = await fetch(`/api/bookings/availability?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<{
        rooms: RoomAvailabilityItem[];
      }>;
    },
    [startTime, endTime, excludeId],
  );

  const refresh = useCallback(async () => {
    if (!open || !startTime || !endTime || startTime >= endTime) {
      setRooms([]);
      setRangeConflictDays([]);
      return;
    }

    setIsLoading(true);
    try {
      if ((bookingMode === "single" || bookingMode === "recurring") && date) {
        const dateStr = format(date, "yyyy-MM-dd");
        const data = await fetchSingleDay(dateStr);
        setRooms(
          (data?.rooms ?? []).map((r) => ({
            ...r,
            busyDays: r.available ? [] : [dateStr],
          })),
        );
        setRangeConflictDays([]);
      } else if (
        bookingMode === "range" &&
        dateRange?.from &&
        dateRange?.to
      ) {
        const days = eachDayOfInterval({
          start: dateRange.from,
          end: dateRange.to,
        });
        const aggregated = new Map<string, AggregatedRoomAvailability>();
        for (const roomName of ROOM_OPTIONS) {
          aggregated.set(roomName, {
            room: roomName,
            available: true,
            busyDays: [],
          });
        }

        for (const day of days) {
          const dateStr = format(day, "yyyy-MM-dd");
          const data = await fetchSingleDay(dateStr);
          for (const entry of data?.rooms ?? []) {
            const agg = aggregated.get(entry.room);
            if (!agg) continue;
            if (!entry.available) {
              agg.available = false;
              agg.busyDays = [...(agg.busyDays ?? []), dateStr];
              if (!agg.conflict && entry.conflict) {
                agg.conflict = entry.conflict;
                agg.conflictingBookingId = entry.conflictingBookingId;
              }
            }
          }
        }

        const aggregatedList = Array.from(aggregated.values());
        setRooms(aggregatedList);
        if (room) {
          const selected = aggregated.get(room);
          setRangeConflictDays(selected?.busyDays ?? []);
        } else {
          setRangeConflictDays([]);
        }
      } else {
        setRooms([]);
        setRangeConflictDays([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    open,
    bookingMode,
    date,
    dateRange,
    startTime,
    endTime,
    room,
    fetchSingleDay,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void refresh();
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refresh]);

  const selectedRoomAvailable = room
    ? (rooms.find((r) => r.room === room)?.available ?? null)
    : null;

  const availableRooms = rooms.filter((r) => r.available).map((r) => r.room);

  return {
    rooms,
    availableRooms,
    selectedRoomAvailable,
    rangeConflictDays,
    isLoading,
    refresh,
  };
}
