"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Booking } from "@/lib/booking-types";
import { ROOM_OPTIONS, getRoomBadgeColor, type RoomName } from "@/lib/rooms";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

interface RoomTimetableProps {
  onBookingClick?: (booking: Booking) => void;
}

export function RoomTimetable({ onBookingClick }: RoomTimetableProps) {
  const [date, setDate] = useState(() => new Date());
  const [selectedRoom, setSelectedRoom] = useState<RoomName>(ROOM_OPTIONS[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const dateStr = format(date, "yyyy-MM-dd");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bookings?startDate=${dateStr}&endDate=${dateStr}&limit=500&page=1`,
      );
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    void load();
  }, [load]);

  const byRoom = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const room of ROOM_OPTIONS) map.set(room, []);
    for (const b of bookings) {
      const list = map.get(b.className);
      if (list) list.push(b);
    }
    return map;
  }, [bookings]);

  const shiftDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setDate(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => shiftDay(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start sm:min-w-[200px] sm:w-auto">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "EEEE, MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
            </PopoverContent>
          </Popover>
          <Button type="button" variant="outline" size="icon" onClick={() => shiftDay(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} on this day
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
        <div className="space-y-3 md:hidden">
          <Select
            value={selectedRoom}
            onValueChange={(value) => setSelectedRoom(value as RoomName)}
          >
            <SelectTrigger className="w-full border-primary/20">
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_OPTIONS.map((room) => (
                <SelectItem key={room} value={room}>
                  {room}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="overflow-hidden rounded-md border border-border">
            {HOURS.map((hour) => {
              const slotStart = hour * 60;
              const slotEnd = (hour + 1) * 60;
              const label = `${String(hour).padStart(2, "0")}:00`;
              const roomBookings = byRoom.get(selectedRoom) ?? [];
              const match = roomBookings.find((b) => {
                const start = toMinutes(b.startTime);
                const end = toMinutes(b.endTime);
                return start < slotEnd && end > slotStart;
              });

              return (
                <div
                  key={hour}
                  className="flex border-b border-border/60 last:border-b-0"
                >
                  <div className="w-16 shrink-0 border-r border-border bg-muted/50 px-2 py-3 text-xs font-medium tabular-nums text-muted-foreground">
                    {label}
                  </div>
                  <div className="min-h-12 flex-1 px-2 py-1.5">
                    {match ? (
                      <button
                        type="button"
                        onClick={() => onBookingClick?.(match)}
                        className={cn(
                          "w-full rounded-md border px-3 py-2 text-left text-xs transition-colors hover:opacity-90",
                          getRoomBadgeColor(selectedRoom),
                          "border-transparent",
                        )}
                      >
                        <p className="font-semibold leading-tight">{match.groupName}</p>
                        <p className="text-[11px] opacity-80">
                          {match.startTime}–{match.endTime}
                        </p>
                      </button>
                    ) : (
                      <div className="h-10 rounded-md bg-muted/30" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="scrollbar-brand hidden overflow-x-auto rounded-md border border-border md:block">
          <table className="min-w-[900px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="sticky left-0 z-10 w-20 border-b border-r border-border bg-muted px-2 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                  Time
                </th>
                {ROOM_OPTIONS.map((room) => (
                  <th
                    key={room}
                    className="min-w-[120px] border-b border-border px-2 py-2 text-left text-xs font-medium uppercase"
                  >
                    <Badge variant="outline" className={getRoomBadgeColor(room)}>
                      {room}
                    </Badge>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => {
                const slotStart = hour * 60;
                const slotEnd = (hour + 1) * 60;
                const label = `${String(hour).padStart(2, "0")}:00`;

                return (
                  <tr key={hour} className="border-b border-border/60">
                    <td className="sticky left-0 z-10 border-r border-border bg-card px-2 py-3 text-xs font-medium tabular-nums text-muted-foreground">
                      {label}
                    </td>
                    {ROOM_OPTIONS.map((room) => {
                      const match = (byRoom.get(room) ?? []).find((b) => {
                        const start = toMinutes(b.startTime);
                        const end = toMinutes(b.endTime);
                        return start < slotEnd && end > slotStart;
                      });

                      return (
                        <td key={room} className="px-1 py-1 align-top">
                          {match ? (
                            <button
                              type="button"
                              onClick={() => onBookingClick?.(match)}
                              className={cn(
                                "w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors hover:opacity-90",
                                getRoomBadgeColor(room),
                                "border-transparent",
                              )}
                            >
                              <p className="font-semibold leading-tight">{match.groupName}</p>
                              <p className="text-[11px] opacity-80">
                                {match.startTime}–{match.endTime}
                              </p>
                            </button>
                          ) : (
                            <div className="h-10 rounded-md bg-muted/30" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
