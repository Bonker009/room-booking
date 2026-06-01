"use client";

import { createContext, useContext, useEffect, useState } from "react";

import type { Dispatch, SetStateAction } from "react";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type { TBadgeVariant, TCalendarView, TVisibleHours, TWorkingHours } from "@/calendar/types";
import { getCalendarVisibleRange } from "@/lib/calendar-range";

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedRoomId: string | "all";
  setSelectedRoomId: (roomId: string | "all") => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  users: IUser[];
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: IEvent[];
  setLocalEvents: Dispatch<SetStateAction<IEvent[]>>;
  calendarView: TCalendarView;
  setCalendarView: (view: TCalendarView) => void;
  onEventUpdate?: (event: IEvent) => Promise<void>;
  onSlotClick?: (date: Date, hour?: number, minute?: number) => void;
  onAddBooking?: () => void;
  onViewBooking?: (bookingId: string) => void;
  onEditBooking?: (bookingId: string) => void;
}

const CalendarContext = createContext({} as ICalendarContext);

const WORKING_HOURS = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

const VISIBLE_HOURS = { from: 7, to: 18 };

interface CalendarProviderProps {
  children: React.ReactNode;
  users: IUser[];
  events: IEvent[];
  calendarView?: TCalendarView;
  onCalendarViewChange?: (view: TCalendarView) => void;
  onEventUpdate?: (event: IEvent) => Promise<void>;
  onSlotClick?: (date: Date, hour?: number, minute?: number) => void;
  onAddBooking?: () => void;
  onViewBooking?: (bookingId: string) => void;
  onEditBooking?: (bookingId: string) => void;
  onVisibleRangeChange?: (startDate: string, endDate: string) => void;
}

export function CalendarProvider({
  children,
  users,
  events,
  calendarView: controlledView,
  onCalendarViewChange,
  onEventUpdate,
  onSlotClick,
  onAddBooking,
  onViewBooking,
  onEditBooking,
  onVisibleRangeChange,
}: CalendarProviderProps) {
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  const [visibleHours, setVisibleHours] = useState<TVisibleHours>(VISIBLE_HOURS);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(WORKING_HOURS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState<string | "all">("all");
  const [internalView, setInternalView] = useState<TCalendarView>("month");
  const [localEvents, setLocalEvents] = useState<IEvent[]>(events);

  const calendarView = controlledView ?? internalView;

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  useEffect(() => {
    if (!onVisibleRangeChange) return;
    const { startDate, endDate } = getCalendarVisibleRange(
      selectedDate,
      calendarView,
    );
    onVisibleRangeChange(startDate, endDate);
  }, [selectedDate, calendarView, onVisibleRangeChange]);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const setCalendarView = (view: TCalendarView) => {
    if (onCalendarViewChange) {
      onCalendarViewChange(view);
    } else {
      setInternalView(view);
    }
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedRoomId,
        setSelectedRoomId,
        badgeVariant,
        setBadgeVariant,
        users,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        events: localEvents,
        setLocalEvents,
        calendarView,
        setCalendarView,
        onEventUpdate,
        onSlotClick,
        onAddBooking,
        onViewBooking,
        onEditBooking,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context) throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
