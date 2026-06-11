"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Building2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { KioskRoomStatus } from "@/lib/db";
import { getRoomBadgeColor } from "@/lib/rooms";

interface KioskPayload {
  date: string;
  asOf: string;
  rooms: KioskRoomStatus[];
}

const POLL_MS = 30_000;

function formatTime12(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = Number.parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function KioskPage() {
  const [payload, setPayload] = useState<KioskPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kiosk/status");
      if (!res.ok) throw new Error("Failed to load");
      setPayload(await res.json());
      setError(null);
    } catch {
      setError("Could not load room status");
    }
  }, []);

  useEffect(() => {
    void load();
    const dataTimer = window.setInterval(() => void load(), POLL_MS);
    const clockTimer = window.setInterval(() => setClock(new Date()), 1000);
    return () => {
      window.clearInterval(dataTimer);
      window.clearInterval(clockTimer);
    };
  }, [load]);

  const busyCount = payload?.rooms.filter((r) => r.status === "busy").length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#001a33] to-[#003366] text-white">
      <header className="border-b border-white/10 px-6 py-5 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-white/70 uppercase">
              KSHRD Room Status
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Live availability
            </h1>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold tabular-nums sm:text-5xl">
              {format(clock, "h:mm a")}
            </p>
            <p className="text-sm text-white/75">
              {payload
                ? format(parseISO(`${payload.date}T12:00:00`), "EEEE, MMMM d, yyyy")
                : format(clock, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10">
        {error ? (
          <p className="rounded-lg border border-red-400/40 bg-red-950/40 px-4 py-3 text-red-100">
            {error}
          </p>
        ) : null}

        {!payload && !error ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : null}

        {payload ? (
          <>
            <p className="mb-6 text-sm text-white/70">
              {busyCount} of {payload.rooms.length} rooms in use right now
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {payload.rooms.map((room) => (
                <RoomKioskCard key={room.room} room={room} />
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

function RoomKioskCard({ room }: { room: KioskRoomStatus }) {
  const isBusy = room.status === "busy";

  return (
    <article
      className={`rounded-2xl border p-5 shadow-lg transition-colors ${
        isBusy
          ? "border-rose-400/40 bg-rose-950/50"
          : "border-emerald-400/30 bg-emerald-950/35"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 shrink-0 text-white/80" />
          <h2 className="text-2xl font-bold">{room.room}</h2>
        </div>
        <Badge
          variant="outline"
          className={
            isBusy
              ? "border-rose-300/50 bg-rose-500/20 text-rose-50"
              : "border-emerald-300/50 bg-emerald-500/20 text-emerald-50"
          }
        >
          {isBusy ? "Busy" : "Free"}
        </Badge>
      </div>

      <div className="mt-4 space-y-2">
        {isBusy ? (
          <>
            <p className="text-lg font-semibold">{room.groupName}</p>
            <p className="flex items-center gap-2 text-sm text-white/85">
              <Clock className="h-4 w-4 shrink-0" />
              Until {room.until ? formatTime12(room.until) : "—"}
            </p>
          </>
        ) : room.nextBooking ? (
          <p className="text-sm leading-relaxed text-white/85">
            Next:{" "}
            <span className="font-medium text-white">{room.nextBooking.groupName}</span>
            {" · "}
            {formatTime12(room.nextBooking.startTime)}–
            {formatTime12(room.nextBooking.endTime)}
          </p>
        ) : (
          <p className="text-sm text-white/75">No more bookings today</p>
        )}
      </div>

      <div className="mt-4">
        <Badge variant="outline" className={getRoomBadgeColor(room.room)}>
          {room.room}
        </Badge>
      </div>
    </article>
  );
}
