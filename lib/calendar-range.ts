import {
  addDays,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

import type { TCalendarView } from "@/calendar/types";

export interface CalendarVisibleRange {
  startDate: string;
  endDate: string;
}

export function getCalendarVisibleRange(
  selectedDate: Date,
  view: TCalendarView,
): CalendarVisibleRange {
  let start: Date;
  let end: Date;

  switch (view) {
    case "day":
      start = selectedDate;
      end = selectedDate;
      break;
    case "week":
      start = startOfWeek(selectedDate);
      end = endOfWeek(selectedDate);
      break;
    case "month":
    case "agenda":
      start = startOfWeek(startOfMonth(selectedDate));
      end = endOfWeek(endOfMonth(selectedDate));
      break;
    case "year":
      start = startOfYear(selectedDate);
      end = endOfYear(selectedDate);
      break;
    default:
      start = startOfMonth(selectedDate);
      end = endOfMonth(selectedDate);
  }

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

/** Small buffer for prefetch when navigating. */
export function expandRange(
  range: CalendarVisibleRange,
  days = 7,
): CalendarVisibleRange {
  const start = addDays(new Date(`${range.startDate}T00:00:00`), -days);
  const end = addDays(new Date(`${range.endDate}T00:00:00`), days);
  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}
