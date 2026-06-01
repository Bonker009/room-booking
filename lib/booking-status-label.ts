export type BookingStatusLabel =
  | "Upcoming"
  | "In Progress"
  | "Completed"
  | "Unknown";

/** Pure status label for server-side filtering/sorting. */
export function computeBookingStatusLabel(
  booking: { date: string; startTime: string; endTime: string },
  now: Date = new Date(),
): BookingStatusLabel {
  try {
    const [y, m, d] = booking.date.split("-").map(Number);
    const bookingDate = new Date(y, m - 1, d);
    const [startHours, startMinutes] = booking.startTime.split(":");
    const startTime = new Date(bookingDate);
    startTime.setHours(
      Number.parseInt(startHours, 10),
      Number.parseInt(startMinutes, 10),
      0,
      0,
    );
    const [endHours, endMinutes] = booking.endTime.split(":");
    const endTime = new Date(bookingDate);
    endTime.setHours(
      Number.parseInt(endHours, 10),
      Number.parseInt(endMinutes, 10),
      0,
      0,
    );
    if (now < startTime) return "Upcoming";
    if (now >= startTime && now <= endTime) return "In Progress";
    return "Completed";
  } catch {
    return "Unknown";
  }
}
