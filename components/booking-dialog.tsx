"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (bookingData: BookingFormData) => Promise<void>;
  existingBookings: Booking[];
  editingBooking?: Booking | null;
}

interface BookingFormData {
  date: Date | undefined;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy: string;
}

interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy: string;
}

export function BookingDialog({
  open,
  onOpenChange,
  onSubmit,
  existingBookings,
  editingBooking = null,
}: BookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [groupName, setGroupName] = useState("");
  const [room, setRoom] = useState("");
  const [bookedBy, setBookedBy] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing
  useEffect(() => {
    if (editingBooking) {
      setDate(new Date(editingBooking.date));
      setStartTime(editingBooking.startTime);
      setEndTime(editingBooking.endTime);
      setGroupName(editingBooking.groupName);
      setRoom(editingBooking.className);
      setBookedBy(editingBooking.bookedBy || "");
    } else {
      // Set default values for new booking
      const now = new Date();
      setDate(now);

      // Default to next hour, rounded to nearest 30 min
      const hours = now.getHours();
      const minutes = now.getMinutes() >= 30 ? 0 : 30;
      const nextHour = minutes === 0 ? hours + 1 : hours;

      setStartTime(
        `${nextHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
      );
      setEndTime(
        `${(nextHour + 1).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
      );

      setGroupName("");
      setRoom("");
      setBookedBy("");
    }
  }, [editingBooking, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = "Please select a date";
    if (!startTime) newErrors.startTime = "Please select a start time";
    if (!endTime) newErrors.endTime = "Please select an end time";
    if (!groupName.trim()) newErrors.groupName = "Please enter a group name";
    if (!room) newErrors.room = "Please select a room";
    if (!bookedBy.trim())
      newErrors.bookedBy = "Please enter who is booking this room";

    // Validate time format and logic
    if (startTime && endTime) {
      if (startTime >= endTime) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    // Check for booking conflicts
    if (date && startTime && endTime && room && !newErrors.endTime) {
      const hasConflict = checkBookingConflicts({
        date: date,
        startTime,
        endTime,
        groupName,
        className: room,
      });

      if (hasConflict) {
        newErrors.conflict = "This room is already booked during this time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkBookingConflicts = (booking: any): boolean => {
    // Skip checking against the booking we're currently editing
    const bookingsToCheck = editingBooking
      ? existingBookings.filter((b) => b.id !== editingBooking.id)
      : existingBookings;

    // Convert form date to string format for comparison
    const bookingDateStr = format(booking.date, "yyyy-MM-dd");

    for (const existingBooking of bookingsToCheck) {
      // Only check bookings for the same room and date
      if (
        existingBooking.className === booking.className &&
        existingBooking.date === bookingDateStr
      ) {
        // Check for time overlap
        if (
          (booking.startTime >= existingBooking.startTime &&
            booking.startTime < existingBooking.endTime) ||
          (booking.endTime > existingBooking.startTime &&
            booking.endTime <= existingBooking.endTime) ||
          (booking.startTime <= existingBooking.startTime &&
            booking.endTime >= existingBooking.endTime)
        ) {
          return true; // Conflict found
        }
      }
    }

    return false; // No conflicts
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        date,
        startTime,
        endTime,
        groupName,
        className: room,
      });

      // Reset form
      if (!editingBooking) {
        setDate(new Date());
        setStartTime("");
        setEndTime("");
        setGroupName("");
        setRoom("");
      }

      onOpenChange(false);
    } catch (error) {
      toast("Error", {
        description: "Failed to save booking. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const formattedHour = hour.toString().padStart(2, "0");
    const formattedMinute = minute.toString().padStart(2, "0");
    const time = `${formattedHour}:${formattedMinute}`;

    // Format for display (12-hour format)
    const hour12 = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayTime = `${hour12}:${formattedMinute} ${ampm}`;

    return { value: time, label: displayTime };
  });

  const formatTimeForDisplay = (time: string) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":").map(Number);
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
        <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingBooking ? "Edit Booking" : "Create New Booking"}
            </DialogTitle>
            <DialogDescription className="text-sky-100 mt-1">
              {editingBooking
                ? "Update the details of your room reservation"
                : "Fill in the details to book a room for your event"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date Field */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date ? "border-red-500" : "border-input",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                />
              </PopoverContent>
            </Popover>
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date}</p>
            )}
          </div>

          {/* Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-medium">
                Start Time
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger
                  id="startTime"
                  className={cn(
                    errors.startTime
                      ? "border-red-500 w-full"
                      : "border-input w-full",
                  )}
                >
                  <div className="flex items-center ">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select time">
                      {startTime
                        ? formatTimeForDisplay(startTime)
                        : "Select time"}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-medium">
                End Time
              </Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger
                  id="endTime"
                  className={cn(
                    errors.endTime
                      ? "border-red-500 w-full"
                      : "border-input w-full",
                  )}
                >
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select time">
                      {endTime ? formatTimeForDisplay(endTime) : "Select time"}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Group Name Field */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium">
              Group Name
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="groupName"
                placeholder="Enter group name"
                className={cn(
                  "pl-10",
                  errors.groupName ? "border-red-500" : "border-input",
                )}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            {errors.groupName && (
              <p className="text-sm text-red-500">{errors.groupName}</p>
            )}
          </div>

          {/* Room Field */}
          <div className="space-y-2">
            <Label htmlFor="room" className="text-sm font-medium">
              Room
            </Label>
            <Select value={room} onValueChange={setRoom}>
              <SelectTrigger
                id="room"
                className={cn(
                  errors.room ? "border-red-500 w-full" : "border-input w-full",
                )}
              >
                <div className="flex items-center">
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select a room" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTB">BTB</SelectItem>
                <SelectItem value="SR">SR</SelectItem>
                <SelectItem value="PP">PP</SelectItem>
                <SelectItem value="KPS">KPS</SelectItem>
                <SelectItem value="PVH">PVH</SelectItem>
                <SelectItem value="Seminar">Seminar</SelectItem>
                <SelectItem value="Koh Kong">Koh Kong</SelectItem>
              </SelectContent>
            </Select>
            {errors.room && (
              <p className="text-sm text-red-500">{errors.room}</p>
            )}
          </div>

          {/* Booked By Field */}
          <div className="space-y-2">
            <Label htmlFor="bookedBy" className="text-sm font-medium">
              Booked By
            </Label>
            <div className="relative">
              <PersonStandingIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="bookedBy"
                placeholder="Enter name of person booking"
                className={cn(
                  "pl-10",
                  errors.bookedBy ? "border-red-500" : "border-input",
                )}
                value={bookedBy}
                onChange={(e) => setBookedBy(e.target.value)}
              />
            </div>
            {errors.bookedBy && (
              <p className="text-sm text-red-500">{errors.bookedBy}</p>
            )}
          </div>

          {errors.conflict && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
              <div className="flex-shrink-0 mr-2 mt-0.5">⚠️</div>
              <div>
                <p className="font-medium">Booking Conflict</p>
                <p className="text-sm">{errors.conflict}</p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {editingBooking ? "Updating..." : "Creating..."}
                </>
              ) : editingBooking ? (
                "Update Booking"
              ) : (
                "Create Booking"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
