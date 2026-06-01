"use client";

import { Clock } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"] as const;
const PERIODS = ["AM", "PM"] as const;

function to12Hour(value: string): {
  hour: string;
  minute: string;
  period: "AM" | "PM";
} {
  if (!value) return { hour: "", minute: "00", period: "AM" };
  const [hStr, mStr] = value.split(":");
  let h = Number.parseInt(hStr, 10);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const minute = MINUTES.includes(mStr as (typeof MINUTES)[number])
    ? mStr
    : "00";
  return { hour: String(h), minute, period };
}

function to24Hour(hour: string, minute: string, period: "AM" | "PM"): string {
  if (!hour) return "";
  let h = Number.parseInt(hour, 10);
  if (period === "AM") {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return `${String(h).padStart(2, "0")}:${minute}`;
}

interface TimeFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function TimeField({ id, value, onChange, hasError }: TimeFieldProps) {
  const { hour, minute, period } = to12Hour(value);

  const update = (
    nextHour: string,
    nextMinute: string,
    nextPeriod: "AM" | "PM",
  ) => {
    if (!nextHour) {
      onChange("");
      return;
    }
    onChange(to24Hour(nextHour, nextMinute, nextPeriod));
  };

  return (
    <div className="flex items-center gap-1.5">
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Select
        value={hour || undefined}
        onValueChange={(h) => update(h, minute || "00", period)}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "w-[72px]",
            hasError ? "border-destructive" : "border-input",
          )}
          aria-label="Hour"
        >
          <SelectValue placeholder="Hr" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select
        value={minute}
        onValueChange={(m) =>
          update(hour || "9", m, period)
        }
      >
        <SelectTrigger
          className={cn(
            "w-[72px]",
            hasError ? "border-destructive" : "border-input",
          )}
          aria-label="Minute"
        >
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={period}
        onValueChange={(p) =>
          update(hour || "9", minute || "00", p as "AM" | "PM")
        }
      >
        <SelectTrigger
          className={cn(
            "w-[72px]",
            hasError ? "border-destructive" : "border-input",
          )}
          aria-label="AM or PM"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function formatTimeForDisplay(time: string): string {
  if (!time) return "";
  const { hour, minute, period } = to12Hour(time);
  return `${hour}:${minute} ${period}`;
}
