import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { computeBookingStatusLabel } from "@/lib/booking-status-label";
import {
  deleteBookingRecord,
  deleteBookingsBySeriesId,
  findConflictingBookingRecord,
  insertBookingRecord,
  insertBookingRecords,
  readAllBookings,
  readBookingById,
  readBookingsBySeriesId,
  readBookingsForDate,
  readPendingBookings,
  updateBookingRecord,
} from "@/lib/bookings-store";
import type { Booking, RecurringPattern } from "@/lib/booking-model";
import { ROOM_OPTIONS } from "@/lib/rooms";

export type { Booking, RecurringPattern };

export interface BookingQuery {
  startDate?: string;
  endDate?: string;
  className?: string;
  groupName?: string;
  status?: string;
  search?: string;
  tab?: "today" | "upcoming" | "past" | "all" | "mine";
  bookedByEmailExact?: string;
  recordStatus?: "pending" | "confirmed" | "cancelled";
  startTimeFrom?: string;
  endTimeBy?: string;
  statusLabel?: string;
  groupFilter?: string;
  roomExact?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?:
    | "date"
    | "time"
    | "group"
    | "room"
    | "status"
    | "createdAt"
    | "className";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface KioskNextBooking {
  startTime: string;
  endTime: string;
  groupName: string;
}

export interface KioskRoomStatus {
  room: string;
  status: "busy" | "free";
  groupName?: string;
  until?: string;
  nextBooking?: KioskNextBooking;
}

export async function getAllBookings(): Promise<Booking[]> {
  return readAllBookings();
}

export async function getBookingById(id: string): Promise<Booking | null> {
  return readBookingById(id);
}

export async function addBooking(
  booking: Omit<Booking, "id" | "createdAt">,
): Promise<Booking> {
  const newBooking: Booking = {
    id: uuidv4(),
    ...booking,
    createdAt: new Date().toISOString(),
    status: booking.status || "confirmed",
  };

  insertBookingRecord(newBooking);
  return newBooking;
}

export async function updateBooking(
  id: string,
  booking: Partial<Booking>,
): Promise<Booking> {
  const updated = updateBookingRecord(id, booking);
  return (
    updated ??
    ({ id, ...booking, updatedAt: new Date().toISOString() } as Booking)
  );
}

export async function removeBooking(id: string): Promise<boolean> {
  return deleteBookingRecord(id);
}

export async function findConflictingBooking(
  booking: {
    date: string;
    startTime: string;
    endTime: string;
    className: string;
  },
  excludeId?: string,
): Promise<Booking | null> {
  return findConflictingBookingRecord(booking, excludeId);
}

export async function checkBookingConflicts(
  booking: {
    date: string;
    startTime: string;
    endTime: string;
    className: string;
  },
  excludeId?: string,
): Promise<boolean> {
  return (
    (await findConflictingBookingRecord(booking, excludeId)) !== null
  );
}

export async function getBookings(
  query: BookingQuery & { bookedBy?: string },
): Promise<{ bookings: Booking[]; total: number }> {
  let bookings = readAllBookings();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const hasToolbarDateRange = Boolean(query.startDate || query.endDate);

  if (query.startDate != null) {
    bookings = bookings.filter((b) => b.date >= (query.startDate ?? ""));
  }

  if (query.endDate) {
    bookings = bookings.filter((b) => b.date <= (query.endDate ?? ""));
  }

  if (query.dateFrom?.trim()) {
    bookings = bookings.filter((b) => b.date >= query.dateFrom!);
  }

  if (query.dateTo?.trim()) {
    bookings = bookings.filter((b) => b.date <= query.dateTo!);
  }

  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    bookings = bookings.filter((b) =>
      [
        b.date,
        b.startTime,
        b.endTime,
        b.groupName,
        b.className,
        b.bookedBy,
        b.bookedByEmail,
        b.purpose,
      ]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q)),
    );
  }

  if (query.className) {
    bookings = bookings.filter((b) =>
      b.className.toLowerCase().includes(query.className!.toLowerCase()),
    );
  }

  if (query.roomExact?.trim()) {
    bookings = bookings.filter((b) => b.className === query.roomExact);
  }

  if (query.groupName) {
    bookings = bookings.filter(
      (b) =>
        b.groupName.toLowerCase().includes(query.groupName!.toLowerCase()) ||
        (b.purpose &&
          b.purpose.toLowerCase().includes(query.groupName!.toLowerCase())),
    );
  }

  if (query.groupFilter?.trim()) {
    const q = query.groupFilter.trim().toLowerCase();
    bookings = bookings.filter((b) =>
      b.groupName.toLowerCase().includes(q),
    );
  }

  if (query.bookedByEmailExact?.trim()) {
    const email = query.bookedByEmailExact.trim().toLowerCase();
    bookings = bookings.filter(
      (b) => (b.bookedByEmail ?? "").trim().toLowerCase() === email,
    );
  } else if (query.bookedBy) {
    bookings = bookings.filter(
      (b) =>
        b.bookedBy &&
        b.bookedBy.toLowerCase().includes(query.bookedBy!.toLowerCase()),
    );
  }

  if (query.recordStatus) {
    bookings = bookings.filter((b) => (b.status ?? "confirmed") === query.recordStatus);
  }

  if (query.startTimeFrom?.trim()) {
    bookings = bookings.filter((b) => b.startTime >= query.startTimeFrom!);
  }

  if (query.endTimeBy?.trim()) {
    bookings = bookings.filter((b) => b.endTime <= query.endTimeBy!);
  }

  const statusFilter = query.statusLabel?.trim() || query.status?.trim();
  if (statusFilter) {
    bookings = bookings.filter(
      (b) => computeBookingStatusLabel(b, now) === statusFilter,
    );
  }

  if (query.tab === "mine" && query.bookedByEmailExact) {
    // Email filter applied above; tab is a UX marker only.
  } else if (!hasToolbarDateRange && query.tab && query.tab !== "all") {
    if (query.tab === "today") {
      bookings = bookings.filter((b) => b.date === todayStr);
    } else if (query.tab === "upcoming") {
      bookings = bookings.filter((b) => {
        if (b.date > todayStr) return true;
        if (b.date < todayStr) return false;
        const [endHour, endMin] = b.endTime.split(":").map(Number);
        const bookingEnd = new Date(b.date);
        bookingEnd.setHours(endHour, endMin, 0, 0);
        return bookingEnd > now;
      });
    } else if (query.tab === "past") {
      bookings = bookings.filter((b) => {
        if (b.date < todayStr) return true;
        if (b.date > todayStr) return false;
        const [endHour, endMin] = b.endTime.split(":").map(Number);
        const bookingEnd = new Date(b.date);
        bookingEnd.setHours(endHour, endMin, 0, 0);
        return bookingEnd <= now;
      });
    }
  }

  const total = bookings.length;
  const order = query.sortOrder === "desc" ? -1 : 1;

  if (query.sortBy) {
    bookings.sort((a, b) => {
      let primary = 0;
      switch (query.sortBy) {
        case "date":
          primary = a.date.localeCompare(b.date);
          if (primary === 0) primary = a.startTime.localeCompare(b.startTime);
          break;
        case "time":
          primary = a.startTime.localeCompare(b.startTime);
          if (primary === 0) primary = a.endTime.localeCompare(b.endTime);
          if (primary === 0) primary = a.date.localeCompare(b.date);
          break;
        case "group":
          primary = a.groupName.localeCompare(b.groupName, undefined, {
            sensitivity: "base",
          });
          break;
        case "room":
        case "className":
          primary = a.className.localeCompare(b.className, undefined, {
            sensitivity: "base",
          });
          break;
        case "status":
          primary = computeBookingStatusLabel(a, now).localeCompare(
            computeBookingStatusLabel(b, now),
            undefined,
            { sensitivity: "base" },
          );
          break;
        case "createdAt":
          primary = (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
          break;
        default:
          primary = 0;
      }
      return primary * order;
    });
  } else {
    bookings.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      return a.startTime.localeCompare(b.startTime);
    });
  }

  if (query.page !== undefined && query.limit !== undefined) {
    const start = (query.page - 1) * query.limit;
    bookings = bookings.slice(start, start + query.limit);
  }

  return { bookings, total };
}

export async function createRecurringBookings(
  booking: Omit<Booking, "id" | "createdAt">,
  pattern: RecurringPattern,
): Promise<Booking[]> {
  const recurringBookings: Booking[] = [];
  const startDate = new Date(booking.date);
  const endDate = new Date(pattern.endDate);

  while (startDate <= endDate) {
    const newBooking: Booking = {
      id: uuidv4(),
      ...booking,
      date: startDate.toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      status: booking.status || "confirmed",
      recurring: pattern,
    };
    recurringBookings.push(newBooking);

    switch (pattern.frequency) {
      case "daily":
        startDate.setDate(startDate.getDate() + pattern.interval);
        break;
      case "weekly":
        startDate.setDate(startDate.getDate() + pattern.interval * 7);
        break;
      case "monthly":
        startDate.setMonth(startDate.getMonth() + pattern.interval);
        break;
      default:
        throw new Error("Invalid frequency");
    }
  }

  insertBookingRecords(recurringBookings);
  return recurringBookings;
}

export interface RangeBookingConflict {
  date: string;
  message: string;
}

export interface RangeBookingResult {
  created: Booking[];
  conflicts: RangeBookingConflict[];
  seriesId: string;
}

export async function createRangeBookings(
  booking: Omit<Booking, "id" | "createdAt" | "date">,
  startDate: string,
  endDate: string,
): Promise<RangeBookingResult> {
  const created: Booking[] = [];
  const conflicts: RangeBookingConflict[] = [];
  const seriesId = uuidv4();

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (start > end) {
    throw new Error("startDate must be on or before endDate");
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    const dateStr = format(cursor, "yyyy-MM-dd");
    const hasConflict = await checkBookingConflicts({
      date: dateStr,
      startTime: booking.startTime,
      endTime: booking.endTime,
      className: booking.className,
    });

    if (hasConflict) {
      conflicts.push({
        date: dateStr,
        message: "This room is already booked during this time",
      });
    } else {
      created.push({
        id: uuidv4(),
        ...booking,
        date: dateStr,
        seriesId,
        createdAt: new Date().toISOString(),
        status: booking.status || "confirmed",
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (created.length > 0) {
    insertBookingRecords(created);
  }

  return { created, conflicts, seriesId };
}

function currentLocalTimeHHmm(now = new Date()): string {
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export async function getKioskRoomStatuses(
  date?: string,
  now = new Date(),
): Promise<{ date: string; asOf: string; rooms: KioskRoomStatus[] }> {
  const dateStr = date ?? now.toISOString().split("T")[0];
  const nowTime = currentLocalTimeHHmm(now);
  const bookingsByRoom = new Map<string, Booking[]>();

  for (const room of ROOM_OPTIONS) {
    bookingsByRoom.set(room, []);
  }

  for (const booking of readBookingsForDate(dateStr)) {
    const list = bookingsByRoom.get(booking.className);
    if (list) list.push(booking);
  }

  const rooms: KioskRoomStatus[] = ROOM_OPTIONS.map((room) => {
    const dayBookings = bookingsByRoom.get(room) ?? [];
    const active = dayBookings.find(
      (b) => b.startTime <= nowTime && b.endTime > nowTime,
    );

    if (active) {
      return {
        room,
        status: "busy" as const,
        groupName: active.groupName,
        until: active.endTime,
      };
    }

    const next = dayBookings.find((b) => b.startTime > nowTime);
    return {
      room,
      status: "free" as const,
      nextBooking: next
        ? {
            startTime: next.startTime,
            endTime: next.endTime,
            groupName: next.groupName,
          }
        : undefined,
    };
  });

  return { date: dateStr, asOf: now.toISOString(), rooms };
}

export async function getBookingsBySeriesId(
  seriesId: string,
): Promise<Booking[]> {
  return readBookingsBySeriesId(seriesId);
}

export async function removeBookingSeries(seriesId: string): Promise<number> {
  return deleteBookingsBySeriesId(seriesId);
}

export interface SeriesUpdatePatch {
  startTime?: string;
  endTime?: string;
  groupName?: string;
  className?: string;
  purpose?: string;
  description?: string;
}

export interface SeriesUpdateResult {
  updated: Booking[];
  conflicts: { id: string; date: string; message: string }[];
}

export async function updateBookingSeries(
  seriesId: string,
  patch: SeriesUpdatePatch,
): Promise<SeriesUpdateResult> {
  const series = readBookingsBySeriesId(seriesId);
  const updated: Booking[] = [];
  const conflicts: SeriesUpdateResult["conflicts"] = [];

  for (const booking of series) {
    const next = {
      date: booking.date,
      startTime: patch.startTime ?? booking.startTime,
      endTime: patch.endTime ?? booking.endTime,
      className: patch.className ?? booking.className,
    };

    const conflict = await findConflictingBookingRecord(next, booking.id);
    if (conflict) {
      conflicts.push({
        id: booking.id,
        date: booking.date,
        message: "Room conflict on this day",
      });
      continue;
    }

    const result = updateBookingRecord(booking.id, {
      ...patch,
      date: booking.date,
    });
    if (result) updated.push(result);
  }

  return { updated, conflicts };
}

export async function getPendingBookings(): Promise<Booking[]> {
  return readPendingBookings();
}

export interface AdminBookingStats {
  totalBookings: number;
  pendingCount: number;
  todayCount: number;
  upcomingCount: number;
  roomUtilization: { room: string; count: number }[];
  peakHours: { hour: string; count: number }[];
}

export async function getAdminBookingStats(): Promise<AdminBookingStats> {
  const bookings = readAllBookings();
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const roomCounts = new Map<string, number>();
  const hourCounts = new Map<string, number>();

  let todayCount = 0;
  let upcomingCount = 0;

  for (const b of bookings) {
    roomCounts.set(b.className, (roomCounts.get(b.className) ?? 0) + 1);
    const hour = b.startTime.split(":")[0] ?? "00";
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);

    if (b.date === todayStr) {
      todayCount += 1;
      const [endH, endM] = b.endTime.split(":").map(Number);
      const end = new Date(`${b.date}T12:00:00`);
      end.setHours(endH, endM, 0, 0);
      if (end > now) upcomingCount += 1;
    } else if (b.date > todayStr) {
      upcomingCount += 1;
    }
  }

  const roomUtilization = [...roomCounts.entries()]
    .map(([room, count]) => ({ room, count }))
    .sort((a, b) => b.count - a.count);

  const peakHours = [...hourCounts.entries()]
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalBookings: bookings.length,
    pendingCount: readPendingBookings().length,
    todayCount,
    upcomingCount,
    roomUtilization,
    peakHours,
  };
}
