export type { Booking, RecurringPattern } from "@/lib/booking-model";

export type DashboardView = "table" | "calendar" | "timetable";

/** Prefill for create-booking dialog (calendar slot, duplicate, etc.). */
export interface BookingDialogPrefill {
  date?: Date;
  startTime?: string;
  endTime?: string;
  groupName?: string;
  className?: string;
  purpose?: string;
}
