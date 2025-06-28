import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Define the data path relative to the project root
const DATA_PATH = path.join(process.cwd(), "data", "bookings.json");

// Define the Booking type
export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  // New optional fields
  description?: string;
  attendees?: number;
  recurring?: RecurringPattern;
  status?: "confirmed" | "pending" | "cancelled";
}

// Define recurring booking pattern
export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number; // Every X days/weeks/months
  endDate: string; // When the recurring pattern ends
}

// Define query parameters for filtering bookings
export interface BookingQuery {
  startDate?: string;
  endDate?: string;
  className?: string;
  groupName?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: "date" | "createdAt" | "className";
  sortOrder?: "asc" | "desc";
}

/**
 * Read bookings data from the JSON file
 */
async function readData(): Promise<Booking[]> {
  try {
    const str = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(str);
  } catch (e) {
    // File not found or invalid -> start with empty array
    return [];
  }
}

/**
 * Write bookings data to the JSON file
 */
async function writeData(data: Booking[]): Promise<void> {
  // Ensure the directory exists
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  // Write the data with pretty formatting
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
}

/**
 * Get all bookings
 */
export async function getAllBookings(): Promise<Booking[]> {
  return await readData();
}

/**
 * Get bookings with filtering, pagination and sorting
 */
export async function getBookings(
  query: BookingQuery = {},
): Promise<{ bookings: Booking[]; total: number }> {
  let bookings = await readData();

  // Apply filters
  if (query.startDate) {
    bookings = bookings.filter((b) => b.date >= query.startDate!);
  }

  if (query.endDate) {
    bookings = bookings.filter((b) => b.date <= query.endDate!);
  }

  if (query.className) {
    bookings = bookings.filter((b) => b.className === query.className);
  }

  if (query.groupName) {
    bookings = bookings.filter((b) =>
      b.groupName.toLowerCase().includes(query.groupName!.toLowerCase()),
    );
  }

  if (query.status) {
    bookings = bookings.filter((b) => b.status === query.status);
  }

  // Get total before pagination
  const total = bookings.length;

  // Apply sorting
  const sortBy = query.sortBy || "date";
  const sortOrder = query.sortOrder || "asc";

  bookings.sort((a, b) => {
    const aValue = (a[sortBy as keyof Booking] as string) || "";
    const bValue = (b[sortBy as keyof Booking] as string) || "";

    return sortOrder === "asc"
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Apply pagination
  if (query.page !== undefined && query.limit !== undefined) {
    const start = (query.page - 1) * query.limit;
    bookings = bookings.slice(start, start + query.limit);
  }

  return { bookings, total };
}

/**
 * Add a new booking
 */
export async function addBooking(
  booking: Omit<Booking, "id" | "createdAt">,
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

/**
 * Update an existing booking
 */
export async function updateBooking(
  id: string,
  bookingData: Partial<Booking>,
): Promise<Booking | null> {
  const bookings = await readData();

  // Find the booking index
  const index = bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;

  // Update the booking
  const updatedBooking: Booking = {
    ...bookings[index],
    ...bookingData,
    updatedAt: new Date().toISOString(),
  };

  bookings[index] = updatedBooking;
  await writeData(bookings);

  return updatedBooking;
}

/**
 * Remove a booking by ID
 */
export async function removeBooking(id: string): Promise<boolean> {
  let bookings = await readData();
  const initialLength = bookings.length;

  bookings = bookings.filter((b) => b.id !== id);

  // Only write if something was actually removed
  if (bookings.length !== initialLength) {
    await writeData(bookings);
    return true;
  }

  return false;
}

/**
 * Get a booking by ID
 */
export async function getBookingById(id: string): Promise<Booking | null> {
  const bookings = await readData();
  return bookings.find((b) => b.id === id) || null;
}

/**
 * Check if a booking conflicts with existing bookings
 */
export async function checkBookingConflicts(
  booking: Pick<Booking, "date" | "startTime" | "endTime" | "className">,
  excludeId?: string,
): Promise<boolean> {
  const bookings = await readData();

  // Filter out the booking we're checking against (for updates)
  const otherBookings = excludeId
    ? bookings.filter((b) => b.id !== excludeId)
    : bookings;

  // Check for conflicts
  for (const existingBooking of otherBookings) {
    // Only check bookings for the same room and date
    if (
      existingBooking.className === booking.className &&
      existingBooking.date === booking.date
    ) {
      // Check for time overlap
      if (
        (booking.startTime >= existingBooking.startTime &&
          booking.startTime < existingBooking.endTime) ||
        (booking.endTime > existingBooking.startTime &&
          booking.endTime <= existingBooking.endTime) ||
        (booking.startTime <= existingBooking.startTime &&
          booking.endTime >= existingBooking.endTime)
      ) {
        return true; // Conflict found
      }
    }
  }

  return false; // No conflicts
}

/**
 * Create recurring bookings
 */
export async function createRecurringBookings(
  baseBooking: Omit<Booking, "id" | "createdAt">,
  pattern: RecurringPattern,
): Promise<Booking[]> {
  if (!pattern || !pattern.frequency || !pattern.interval || !pattern.endDate) {
    throw new Error("Invalid recurring pattern");
  }

  const createdBookings: Booking[] = [];
  const startDate = new Date(baseBooking.date);
  const endDate = new Date(pattern.endDate);

  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    // Create a booking for the current date
    const booking = {
      ...baseBooking,
      date: currentDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      recurring: pattern,
    };

    // Check for conflicts
    const hasConflict = await checkBookingConflicts(booking);

    if (!hasConflict) {
      const newBooking = await addBooking(booking);
      createdBookings.push(newBooking);
    }

    // Move to the next date based on the frequency
    if (pattern.frequency === "daily") {
      currentDate.setDate(currentDate.getDate() + pattern.interval);
    } else if (pattern.frequency === "weekly") {
      currentDate.setDate(currentDate.getDate() + 7 * pattern.interval);
    } else if (pattern.frequency === "monthly") {
      currentDate.setMonth(currentDate.getMonth() + pattern.interval);
    }
  }

  return createdBookings;
}

/**
 * Get room availability for a date range
 */
export async function getRoomAvailability(
  roomName: string,
  startDate: string,
  endDate: string,
): Promise<
  { date: string; availableHours: { start: string; end: string }[] }[]
> {
  const bookings = await readData();

  // Filter bookings for the specified room and date range
  const roomBookings = bookings.filter(
    (b) => b.className === roomName && b.date >= startDate && b.date <= endDate,
  );

  // Generate dates in the range
  const result = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];

    // Get bookings for this date
    const dayBookings = roomBookings.filter((b) => b.date === dateStr);

    // Sort by start time
    dayBookings.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Find available time slots (assuming 8:00 to 20:00 operating hours)
    const availableHours = [];
    let lastEndTime = "08:00";
    const closingTime = "20:00";

    for (const booking of dayBookings) {
      if (booking.startTime > lastEndTime) {
        availableHours.push({
          start: lastEndTime,
          end: booking.startTime,
        });
      }
      lastEndTime = booking.endTime;
    }

    // Add final slot if needed
    if (lastEndTime < closingTime) {
      availableHours.push({
        start: lastEndTime,
        end: closingTime,
      });
    }

    result.push({
      date: dateStr,
      availableHours,
    });
  }

  return result;
}

/**
 * Get booking statistics
 */
export async function getBookingStatistics(): Promise<{
  totalBookings: number;
  bookingsByRoom: Record<string, number>;
  bookingsByDay: Record<string, number>;
  averageDuration: number;
}> {
  const bookings = await readData();

  // Count total bookings
  const totalBookings = bookings.length;

  // Count bookings by room
  const bookingsByRoom: Record<string, number> = {};

  // Count bookings by day of week
  const bookingsByDay: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  // Calculate average duration
  let totalMinutes = 0;

  for (const booking of bookings) {
    // Count by room
    bookingsByRoom[booking.className] =
      (bookingsByRoom[booking.className] || 0) + 1;

    // Count by day of week
    const date = new Date(booking.date);
    const dayOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][date.getDay()];
    bookingsByDay[dayOfWeek]++;

    // Calculate duration
    const [startHour, startMinute] = booking.startTime.split(":").map(Number);
    const [endHour, endMinute] = booking.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    totalMinutes += endMinutes - startMinutes;
  }

  const averageDuration = totalBookings > 0 ? totalMinutes / totalBookings : 0;

  return {
    totalBookings,
    bookingsByRoom,
    bookingsByDay,
    averageDuration,
  };
}

/**
 * Backup bookings data
 */
export async function backupBookings(): Promise<string> {
  const bookings = await readData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    process.cwd(),
    "data",
    `bookings-backup-${timestamp}.json`,
  );

  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.writeFile(backupPath, JSON.stringify(bookings, null, 2));

  return backupPath;
}

/**
 * Restore bookings from backup
 */
export async function restoreBookings(backupPath: string): Promise<boolean> {
  try {
    const backupData = await fs.readFile(backupPath, "utf8");
    const bookings = JSON.parse(backupData);

    // Validate backup data
    if (!Array.isArray(bookings)) {
      throw new Error("Invalid backup format");
    }

    await writeData(bookings);
    return true;
  } catch (error) {
    console.error("Restore failed:", error);
    return false;
  }
}
