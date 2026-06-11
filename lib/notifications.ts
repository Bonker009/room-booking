import type { Booking } from "@/lib/booking-model";

export type BookingNotificationEvent =
  | "created"
  | "updated"
  | "deleted"
  | "approved"
  | "pending";

interface NotifyPayload {
  event: BookingNotificationEvent;
  booking: Partial<Booking> & Pick<Booking, "date" | "startTime" | "endTime" | "className" | "groupName">;
  actorEmail?: string;
}

function formatSubject(payload: NotifyPayload): string {
  const room = payload.booking.className;
  const date = payload.booking.date;
  switch (payload.event) {
    case "created":
      return `[Room Booking] Created: ${room} on ${date}`;
    case "updated":
      return `[Room Booking] Updated: ${room} on ${date}`;
    case "deleted":
      return `[Room Booking] Cancelled: ${room} on ${date}`;
    case "approved":
      return `[Room Booking] Approved: ${room} on ${date}`;
    case "pending":
      return `[Room Booking] Pending approval: ${room} on ${date}`;
    default:
      return `[Room Booking] ${room} on ${date}`;
  }
}

function formatBody(payload: NotifyPayload): string {
  const b = payload.booking;
  return [
    `Event: ${payload.event}`,
    `Room: ${b.className}`,
    `Date: ${b.date}`,
    `Time: ${b.startTime} – ${b.endTime}`,
    `Group: ${b.groupName}`,
    b.purpose ? `Purpose: ${b.purpose}` : null,
    b.bookedBy ? `Booked by: ${b.bookedBy}` : null,
    b.bookedByEmail ? `Email: ${b.bookedByEmail}` : null,
    b.status ? `Status: ${b.status}` : null,
    payload.actorEmail ? `Actor: ${payload.actorEmail}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Fire-and-forget booking notification (webhook or console). */
export function notifyBookingEvent(payload: NotifyPayload): void {
  const webhook = process.env.BOOKING_NOTIFY_WEBHOOK?.trim();
  const body = {
    subject: formatSubject(payload),
    text: formatBody(payload),
    ...payload,
  };

  if (!webhook) {
    console.info("[booking-notify]", body.subject);
    return;
  }

  void fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.error("[booking-notify] webhook failed:", err);
  });
}
