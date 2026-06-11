export interface BookingRules {
  workDayStart: string;
  workDayEnd: string;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  maxDaysAhead: number;
  allowBackdatedForAdmin: boolean;
}

export const DEFAULT_BOOKING_RULES: BookingRules = {
  workDayStart: process.env.BOOKING_WORK_START ?? "08:00",
  workDayEnd: process.env.BOOKING_WORK_END ?? "18:00",
  minDurationMinutes: Number(process.env.BOOKING_MIN_MINUTES ?? "30"),
  maxDurationMinutes: Number(process.env.BOOKING_MAX_MINUTES ?? "480"),
  maxDaysAhead: Number(process.env.BOOKING_MAX_DAYS_AHEAD ?? "90"),
  allowBackdatedForAdmin: true,
};

export interface BookingRuleViolation {
  field: string;
  message: string;
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function validateBookingSlot(
  input: {
    date: string;
    startTime: string;
    endTime: string;
  },
  options: { isAdmin?: boolean; rules?: BookingRules } = {},
): BookingRuleViolation[] {
  const rules = options.rules ?? DEFAULT_BOOKING_RULES;
  const violations: BookingRuleViolation[] = [];
  const startMin = parseMinutes(input.startTime);
  const endMin = parseMinutes(input.endTime);
  const workStart = parseMinutes(rules.workDayStart);
  const workEnd = parseMinutes(rules.workDayEnd);
  const duration = endMin - startMin;

  if (startMin >= endMin) {
    violations.push({
      field: "endTime",
      message: "End time must be after start time",
    });
  }

  if (startMin < workStart || endMin > workEnd) {
    violations.push({
      field: "time",
      message: `Bookings must be between ${rules.workDayStart} and ${rules.workDayEnd}`,
    });
  }

  if (duration < rules.minDurationMinutes) {
    violations.push({
      field: "time",
      message: `Minimum booking duration is ${rules.minDurationMinutes} minutes`,
    });
  }

  if (duration > rules.maxDurationMinutes) {
    violations.push({
      field: "time",
      message: `Maximum booking duration is ${rules.maxDurationMinutes} minutes`,
    });
  }

  const today = todayStr();
  if (input.date < today && !(options.isAdmin && rules.allowBackdatedForAdmin)) {
    violations.push({
      field: "date",
      message: "Cannot book dates in the past",
    });
  }

  const maxDate = addDaysStr(today, rules.maxDaysAhead);
  if (input.date > maxDate) {
    violations.push({
      field: "date",
      message: `Cannot book more than ${rules.maxDaysAhead} days ahead`,
    });
  }

  return violations;
}

export function validateBookingRangeDates(
  startDate: string,
  endDate: string,
  options: { isAdmin?: boolean; rules?: BookingRules } = {},
): BookingRuleViolation[] {
  const rules = options.rules ?? DEFAULT_BOOKING_RULES;
  const violations: BookingRuleViolation[] = [];
  const today = todayStr();

  if (startDate > endDate) {
    violations.push({
      field: "dateRange",
      message: "End date must be on or after start date",
    });
  }

  if (startDate < today && !(options.isAdmin && rules.allowBackdatedForAdmin)) {
    violations.push({
      field: "dateRange",
      message: "Cannot book dates in the past",
    });
  }

  const maxDate = addDaysStr(today, rules.maxDaysAhead);
  if (endDate > maxDate) {
    violations.push({
      field: "dateRange",
      message: `Cannot book more than ${rules.maxDaysAhead} days ahead`,
    });
  }

  return violations;
}
