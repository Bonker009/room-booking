import { useCalendar } from "@/calendar/contexts/calendar-context";

import type { IEvent } from "@/calendar/interfaces";

export function useUpdateEvent() {
  const { setLocalEvents, onEventUpdate } = useCalendar();

  const updateEvent = (event: IEvent) => {
    const newEvent: IEvent = {
      ...event,
      startDate: new Date(event.startDate).toISOString(),
      endDate: new Date(event.endDate).toISOString(),
    };

    setLocalEvents((prev) => {
      const index = prev.findIndex((e) => e.id === event.id);
      if (index === -1) return prev;
      return [...prev.slice(0, index), newEvent, ...prev.slice(index + 1)];
    });

    if (onEventUpdate) {
      void onEventUpdate(newEvent).catch(() => {
        setLocalEvents((prev) => {
          const index = prev.findIndex((e) => e.id === event.id);
          if (index === -1) return prev;
          return [...prev.slice(0, index), event, ...prev.slice(index + 1)];
        });
      });
    }
  };

  return { updateEvent };
}
