// Example database functions - you'll need to update these based on your actual database implementation
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";
import path from "path";
const DATA_PATH = path.join(process.cwd(), "data", "bookings.json");
export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy?: string;
  purpose: string; // Add this required field
  createdAt?: string;
  updatedAt?: string;
  // New optional fields
  description?: string;
  attendees?: number;
  recurring?: RecurringPattern;
  status?: "confirmed" | "pending" | "cancelled";
}

export interface BookingQuery {
  startDate?: string;
  endDate?: string;
  className?: string;
  groupName?: string;
  status?: string;
  sortBy?: "date" | "createdAt" | "className";
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
  query: BookingQuery & { bookedBy?: string }
): Promise<{ bookings: Booking[]; total: number }> {
  let bookings = await readData();

  if (query.startDate != null) {
    bookings = bookings.filter((b) => b.date >= (query.startDate ?? ""));
  }

  if (query.endDate) {
    bookings = bookings.filter((b) => b.date <= (query.endDate ?? ""));
  }

  if (query.className) {
    bookings = bookings.filter((b) =>
      b.className.toLowerCase().includes(query.className!.toLowerCase())
    );
  }

  if (query.groupName) {
    bookings = bookings.filter(
      (b) =>
        b.groupName.toLowerCase().includes(query.groupName!.toLowerCase()) ||
        (b.purpose &&
          b.purpose.toLowerCase().includes(query.groupName!.toLowerCase()))
    );
  }
 
  if (query.bookedBy) {
    bookings = bookings.filter(
      (b) =>
        b.bookedBy &&
        b.bookedBy.toLowerCase().includes(query.bookedBy!.toLowerCase())
    );
  }

  const total = bookings.length;

  if (query.sortBy) {
    const order = query.sortOrder === "asc" ? 1 : -1;
    bookings.sort((a, b) => {
      const sortBy = query.sortBy as keyof Booking;
      if ((a[sortBy] ?? "") < (b[sortBy] ?? "")) return -1 * order;
      if ((a[sortBy] ?? "") > (b[sortBy] ?? "")) return 1 * order;
      return 0;
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
