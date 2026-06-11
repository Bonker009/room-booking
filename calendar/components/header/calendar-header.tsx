"use client";

import { Columns, Grid3x3, List, Plus, Grid2x2, CalendarRange } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { RoomSelect } from "@/calendar/components/header/room-select";
import { TodayButton } from "@/calendar/components/header/today-button";
import { DateNavigator } from "@/calendar/components/header/date-navigator";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-media-query";

import type { IEvent } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
}

const VIEW_OPTIONS: {
  view: TCalendarView;
  label: string;
  tooltip: string;
  icon: typeof List;
  mobile?: boolean;
}[] = [
  { view: "day", label: "View by day", tooltip: "Day view", icon: List, mobile: true },
  { view: "week", label: "View by week", tooltip: "Week view", icon: Columns },
  { view: "month", label: "View by month", tooltip: "Month view", icon: Grid2x2 },
  { view: "year", label: "View by year", tooltip: "Year view", icon: Grid3x3 },
  { view: "agenda", label: "View by agenda", tooltip: "Agenda view", icon: CalendarRange, mobile: true },
];

export function CalendarHeader({ view, events }: IProps) {
  const { setCalendarView, onAddBooking } = useCalendar();
  const isMobile = useIsMobile();
  const visibleViews = isMobile
    ? VIEW_OPTIONS.filter((o) => o.mobile)
    : VIEW_OPTIONS;

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between lg:p-4">
      <div className="flex min-w-0 items-center gap-3">
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className="flex w-full flex-col gap-2 sm:gap-1.5">
        <div className="scrollbar-brand flex w-full flex-nowrap items-center gap-2 overflow-x-auto">
          <div className="inline-flex shrink-0 first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
            {visibleViews.map(({ view: optionView, label, tooltip, icon: Icon }, index) => (
              <Tooltip key={optionView}>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={label}
                    size="icon"
                    variant={view === optionView ? "default" : "outline"}
                    className={cnViewButton(index, visibleViews.length)}
                    onClick={() => setCalendarView(optionView)}
                  >
                    <Icon strokeWidth={1.8} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="hidden shrink-0 sm:block">
            <RoomSelect />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:hidden">
            <RoomSelect />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={() => onAddBooking?.()}>
                <Plus />
                Add Booking
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create a new room booking</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

function cnViewButton(index: number, total: number) {
  if (index === 0) return "rounded-r-none [&_svg]:size-5";
  if (index === total - 1) return "-ml-px rounded-l-none [&_svg]:size-5";
  return "-ml-px rounded-none [&_svg]:size-5";
}
