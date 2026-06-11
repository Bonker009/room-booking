/** Shown after a booking is successfully created. */
export const BOOKING_CREATED_REMINDER =
  "When you finish, please turn off the lights and AC, and rearrange the tables and desks.";

export type BookingCreateSuccessVariant = "success" | "warning" | "pending";

export interface BookingCreateSuccess {
  title: string;
  summary: string;
  variant: BookingCreateSuccessVariant;
}
