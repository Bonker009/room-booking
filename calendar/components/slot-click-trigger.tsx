"use client";

import { useCalendar } from "@/calendar/contexts/calendar-context";

interface SlotClickTriggerProps {
  startDate: Date;
  startTime?: { hour: number; minute: number };
  children: React.ReactNode;
  className?: string;
}

export function SlotClickTrigger({
  startDate,
  startTime,
  children,
  className,
}: SlotClickTriggerProps) {
  const { onSlotClick } = useCalendar();

  return (
    <div
      role="button"
      tabIndex={0}
      className={className}
      onClick={() => onSlotClick?.(startDate, startTime?.hour, startTime?.minute)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSlotClick?.(startDate, startTime?.hour, startTime?.minute);
        }
      }}
    >
      {children}
    </div>
  );
}
