import { validateBookingRangeDates, validateBookingSlot } from "@/lib/booking-rules";
import { roomRequiresApproval } from "@/lib/rooms";
import type { Booking } from "@/lib/booking-model";

export function resolveBookingStatus(
  className: string,
  requested?: Booking["status"],
): Booking["status"] {
  if (roomRequiresApproval(className)) return "pending";
  if (requested === "cancelled") return "cancelled";
  return requested === "pending" ? "pending" : "confirmed";
}

export function validateSlotOrResponse(
  input: { date: string; startTime: string; endTime: string },
  isAdmin: boolean,
): { ok: true } | { ok: false; message: string } {
  const violations = validateBookingSlot(input, { isAdmin });
  if (violations.length > 0) {
    return { ok: false, message: violations[0]!.message };
  }
  return { ok: true };
}

export function validateRangeOrResponse(
  startDate: string,
  endDate: string,
  isAdmin: boolean,
): { ok: true } | { ok: false; message: string } {
  const violations = validateBookingRangeDates(startDate, endDate, { isAdmin });
  if (violations.length > 0) {
    return { ok: false, message: violations[0]!.message };
  }
  return { ok: true };
}
