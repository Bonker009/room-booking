export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy?: string;
  bookedByEmail?: string;
  purpose: string;
  createdAt?: string;
  updatedAt?: string;
  description?: string;
  recurring?: RecurringPattern;
  status?: "confirmed" | "pending" | "cancelled";
  seriesId?: string;
}

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  endDate: string;
  daysOfWeek?: number[];
}
