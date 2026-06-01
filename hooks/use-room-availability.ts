"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { eachDayOfInterval, format } from "date-fns";

import type { DateRangeValue } from "@/components/date-range-picker";
import type { RoomAvailabilityItem } from "@/app/api/bookings/availability/route";

interface UseRoomAvailabilityParams {
  open: boolean;
  bookingMode: "single" | "range";
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
  const [rooms, setRooms] = useState<RoomAvailabilityItem[]>([]);
  const [rangeConflictDays, setRangeConflictDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSingleDay = useCallback(
    async (dateStr: string, targetRoom?: string) => {
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
      if (bookingMode === "single" && date) {
        const dateStr = format(date, "yyyy-MM-dd");
        const data = await fetchSingleDay(dateStr);
        setRooms(data?.rooms ?? []);
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
        const conflicts: string[] = [];
        let latestRooms: RoomAvailabilityItem[] = [];

        for (const day of days) {
          const dateStr = format(day, "yyyy-MM-dd");
          const data = await fetchSingleDay(dateStr);
          if (data?.rooms) {
            latestRooms = data.rooms;
            if (room) {
              const entry = data.rooms.find((r) => r.room === room);
              if (entry && !entry.available) conflicts.push(dateStr);
            }
          }
        }

        setRooms(latestRooms);
        setRangeConflictDays(conflicts);
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
