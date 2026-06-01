"use client";

import { format, parseISO } from "date-fns";
import { Building2, Calendar, Clock, Text, User } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const { onViewBooking, onEditBooking } = useCalendar();
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <Building2 className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Room</p>
              <p className="text-sm text-muted-foreground">{event.room}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Booked by</p>
              <p className="text-sm text-muted-foreground">{event.user.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Start</p>
              <p className="text-sm text-muted-foreground">
                {format(startDate, "MMM d, yyyy h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">End</p>
              <p className="text-sm text-muted-foreground">
                {format(endDate, "MMM d, yyyy h:mm a")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Text className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Purpose</p>
              <p className="text-sm text-muted-foreground">{event.description}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onViewBooking?.(event.id)}
          >
            View details
          </Button>
          <Button type="button" onClick={() => onEditBooking?.(event.id)}>
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
