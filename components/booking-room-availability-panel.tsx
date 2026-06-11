"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import type { AggregatedRoomAvailability } from "@/hooks/use-room-availability";
import { Badge } from "@/components/ui/badge";
import { getRoomBadgeColor } from "@/lib/rooms";
import { cn } from "@/lib/utils";
interface RoomAvailabilityPanelProps {
  rooms: AggregatedRoomAvailability[];
  isLoading: boolean;
  slotLabel: string | null;
  selectedRoom: string;
  onSelectRoom: (room: string) => void;
  bookingMode: "single" | "range" | "recurring";
  rangeConflictDays?: string[];
  className?: string;
}

export function RoomAvailabilityPanel({
  rooms,
  isLoading,
  slotLabel,
  selectedRoom,
  onSelectRoom,
  bookingMode,
  rangeConflictDays = [],
  className,
}: RoomAvailabilityPanelProps) {
  const busyCount = rooms.filter((r) => !r.available).length;
  const freeCount = rooms.filter((r) => r.available).length;

  return (
    <aside
      className={cn("flex flex-col gap-3", className)}
      aria-label="Room availability for selected time slot"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Room status</h3>
        {slotLabel ? (
          <p className="text-muted-foreground text-xs leading-snug">{slotLabel}</p>
        ) : (
          <p className="text-muted-foreground text-xs leading-snug">
            Pick date and times to see room status
          </p>
        )}
        {slotLabel && !isLoading && rooms.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {freeCount} free · {busyCount} busy
          </p>
        )}
      </div>

      {bookingMode === "range" && rangeConflictDays.length > 0 && selectedRoom && (
        <p className="rounded-md border border-destructive/25 bg-destructive/10 px-2.5 py-2 text-xs text-destructive">
          {selectedRoom} is busy on {rangeConflictDays.length} day
          {rangeConflictDays.length !== 1 ? "s" : ""} in this range
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Checking rooms…</p>
        ) : !slotLabel ? (
          <p className="text-muted-foreground text-sm">
            Set a valid date and time range first.
          </p>
        ) : rooms.length === 0 ? (
          <p className="text-muted-foreground text-sm">No room data yet.</p>
        ) : (
          <ul className="space-y-2">
            {rooms.map((entry) => (
              <li key={entry.room}>
                <button
                  type="button"
                  disabled={!entry.available}
                  onClick={() => entry.available && onSelectRoom(entry.room)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2.5 text-left transition-colors",
                    entry.available
                      ? "border-border/80 bg-card hover:bg-muted/60 cursor-pointer"
                      : "border-destructive/20 bg-destructive/5 cursor-default",
                    selectedRoom === entry.room &&
                      entry.available &&
                      "ring-2 ring-primary ring-offset-1",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {entry.available ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            getRoomBadgeColor(entry.room),
                          )}
                        >
                          {entry.room}
                        </Badge>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            entry.available
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-destructive",
                          )}
                        >
                          {entry.available ? "Free" : "Busy"}
                        </span>
                      </div>
                      {!entry.available && entry.conflict && (
                        <p className="text-muted-foreground truncate text-xs">
                          {entry.conflict.startTime}–{entry.conflict.endTime} ·{" "}
                          {entry.conflict.groupName}
                        </p>
                      )}
                      {!entry.available &&
                        entry.busyDays &&
                        entry.busyDays.length > 0 &&
                        bookingMode === "range" && (
                          <p className="text-muted-foreground text-xs">
                            Busy on {entry.busyDays.length} day
                            {entry.busyDays.length !== 1 ? "s" : ""}
                          </p>
                        )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
