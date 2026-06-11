import type { Booking } from "@/lib/booking-model";

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function bookingsToCsv(bookings: Booking[]): string {
  const headers = [
    "id",
    "date",
    "startTime",
    "endTime",
    "room",
    "groupName",
    "purpose",
    "description",
    "bookedBy",
    "bookedByEmail",
    "status",
    "seriesId",
    "createdAt",
  ];

  const rows = bookings.map((b) =>
    [
      b.id,
      b.date,
      b.startTime,
      b.endTime,
      b.className,
      b.groupName,
      b.purpose,
      b.description ?? "",
      b.bookedBy ?? "",
      b.bookedByEmail ?? "",
      b.status ?? "confirmed",
      b.seriesId ?? "",
      b.createdAt ?? "",
    ]
      .map((cell) => escapeCsv(String(cell)))
      .join(","),
  );

  return [headers.join(","), ...rows].join("\r\n");
}
