// Example database functions - you'll need to update these based on your actual database implementation
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";
import { format } from "date-fns";
import { computeBookingStatusLabel } from "@/lib/booking-status-label";

const DATA_PATH = path.join(process.cwd(), "data", "bookings.json");
export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  /** Display name from Keycloak / Better Auth (set by server). */
  bookedBy?: string;
  /** Email from Keycloak / Better Auth (set by server). */
  bookedByEmail?: string;
  purpose: string; // Add this required field
  createdAt?: string;
  updatedAt?: string;
  // New optional fields
  description?: string;
  attendees?: number;
  recurring?: RecurringPattern;
  status?: "confirmed" | "pending" | "cancelled";
  /** Shared id for multi-day range bookings created together. */
  seriesId?: string;
}

export interface BookingQuery {
  startDate?: string;
  endDate?: string;
  className?: string;
  groupName?: string;
  /** Computed status label: Upcoming | In Progress | Completed */
  status?: string;
  search?: string;
  tab?: "today" | "upcoming" | "past" | "all";
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

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  endDate: string;
  daysOfWeek?: number[];
}

// Mock implementation - replace with your actual database calls
let bookingsData: Booking[] = [];

async function readData(): Promise<Booking[]> {
  try {
    const str = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(str);
  } catch (e) {
    // File not found or invalid -> start with empty array
    return [];
  }
}

async function writeData(data: Booking[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  bookingsData = data;
}

export async function getAllBookings(): Promise<Booking[]> {
  return await readData();
}

export async function getBookingById(id: string): Promise<Booking | null> {
  // Your database implementation here
  const bookings = await readData();
  return bookings.find((b) => b.id === id) || null;
}

export async function addBooking(
  booking: Omit<Booking, "id" | "createdAt">
): Promise<Booking> {
  const bookings = await readData();

  // Create a new booking with a UUID and timestamp
  const newBooking: Booking = {
    id: uuidv4(),
    ...booking,
    createdAt: new Date().toISOString(),
    status: booking.status || "confirmed",
  };

  // Add to the beginning of the array (newest first)
  bookings.unshift(newBooking);
  await writeData(bookings);
  return newBooking;
}

export async function updateBooking(
  id: string,
  booking: Partial<Booking>
): Promise<Booking> {
  // Your database implementation here
  // Make sure to include the purpose field when updating
  const bookings = await readData();
  const index = bookings.findIndex((b) => b.id === id);
  if (index !== -1) {
    bookings[index] = {
      ...bookings[index],
      ...booking,
      updatedAt: new Date().toISOString(),
    };
    await writeData(bookings);
  }
  return (
    bookings[index] ||
    ({ id, ...booking, updatedAt: new Date().toISOString() } as Booking)
  );
}

export async function removeBooking(id: string): Promise<boolean> {
  // Your database implementation here
  const bookings = await readData();
  const index = bookings.findIndex((b) => b.id === id);
  console.log("Removing booking with ID:", id, "Index found:", index);
  if (index !== -1) {
    bookings.splice(index, 1);
    await writeData(bookings);
  }
  return index !== -1;
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
  const bookings = await readData();
  return (
    bookings.find(
      (b) =>
        b.id !== excludeId &&
        b.date === booking.date &&
        b.className === booking.className &&
        booking.startTime < b.endTime &&
        booking.endTime > b.startTime,
    ) ?? null
  );
}

export async function checkBookingConflicts(
  booking: {
    date: string;
    startTime: string;
    endTime: string;
    className: string;
  },
  excludeId?: string
): Promise<boolean> {
  // Your database implementation here
  const bookings = await readData();
  return bookings.some(
    (b) =>
      b.id !== excludeId &&
      b.date === booking.date &&
      b.className === booking.className &&
      booking.startTime < b.endTime &&
      booking.endTime > b.startTime
  );
}

export async function getBookings(
  query: BookingQuery & { bookedBy?: string },
): Promise<{ bookings: Booking[]; total: number }> {
  let bookings = await readData();
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

  if (query.bookedBy) {
    bookings = bookings.filter(
      (b) =>
        b.bookedBy &&
        b.bookedBy.toLowerCase().includes(query.bookedBy!.toLowerCase()),
    );
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

  if (!hasToolbarDateRange && query.tab && query.tab !== "all") {
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
  pattern: RecurringPattern
): Promise<Booking[]> {
  // Your database implementation here
  const bookings = await readData();
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
    bookings.unshift(newBooking); // Add to the beginning of the array (newest first)

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

  await writeData(bookings);
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
  endDate: string
): Promise<RangeBookingResult> {
  const bookings = await readData();
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
      const newBooking: Booking = {
        id: uuidv4(),
        ...booking,
        date: dateStr,
        seriesId,
        createdAt: new Date().toISOString(),
        status: booking.status || "confirmed",
      };
      created.push(newBooking);
      bookings.unshift(newBooking);
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  if (created.length > 0) {
    await writeData(bookings);
  }

  return { created, conflicts, seriesId };
}
