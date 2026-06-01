"use client";

import { useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import type { BookingFormData } from "@/components/booking-dialog";
import { eventToBookingPatch } from "@/lib/calendar-mapping";
import type { Booking } from "@/lib/booking-types";

interface UseBookingMutationsOptions {
  onMutated?: () => void | Promise<void>;
}

export function useBookingMutations(options: UseBookingMutationsOptions = {}) {
  const { onMutated } = options;

  const afterMutate = useCallback(async () => {
    if (onMutated) await onMutated();
  }, [onMutated]);

  const handleCreateSubmit = async (formData: BookingFormData) => {
    try {
      if (formData.mode === "range") {
        if (!formData.dateRange?.from || !formData.dateRange?.to) {
          throw new Error("Please select a date range");
        }
        const res = await fetch("/api/bookings/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: format(formData.dateRange.from, "yyyy-MM-dd"),
            endDate: format(formData.dateRange.to, "yyyy-MM-dd"),
            startTime: formData.startTime,
            endTime: formData.endTime,
            groupName: formData.groupName,
            className: formData.className,
            purpose: formData.purpose,
          }),
        });
        const data = await res.json();
        if (res.ok || res.status === 207) {
          await afterMutate();
          if (data.conflicts?.length) {
            toast.warning("Partial booking created", {
              description: data.message,
            });
          } else {
            toast.success("Range booking created", {
              description: data.message,
            });
          }
        } else {
          throw new Error(data.message || "Failed to create range booking");
        }
        return;
      }

      const dateString = formData.date
        ? format(formData.date, "yyyy-MM-dd")
        : "";
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateString,
          startTime: formData.startTime,
          endTime: formData.endTime,
          groupName: formData.groupName,
          className: formData.className,
          purpose: formData.purpose,
        }),
      });
      if (res.ok) {
        await afterMutate();
        toast.success("Booking created", {
          description: `Room booked for ${format(new Date(dateString), "PPP")}`,
        });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create booking");
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
      throw error;
    }
  };

  const handleEditSubmit = async (
    formData: BookingFormData,
    editingBooking: Booking,
  ) => {
    try {
      const dateString = formData.date
        ? format(formData.date, "yyyy-MM-dd")
        : "";
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateString,
          startTime: formData.startTime,
          endTime: formData.endTime,
          groupName: formData.groupName,
          className: formData.className,
          purpose: formData.purpose,
        }),
      });
      if (res.ok) {
        await afterMutate();
        toast.success("Booking updated", {
          description: `Room booking for ${format(new Date(dateString), "PPP")} has been updated`,
        });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update booking");
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (result.ok) {
        await afterMutate();
        toast.success("Booking deleted", {
          description: "The booking has been removed successfully",
        });
      } else {
        toast.error("Failed to delete", {
          description: "Could not delete the booking",
        });
      }
    } catch {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    }
  };

  const handleCalendarEventUpdate = async (event: {
    id: string;
    startDate: string;
    endDate: string;
  }) => {
    const bookingRes = await fetch(`/api/bookings/${event.id}`);
    if (!bookingRes.ok) throw new Error("Booking not found");
    const booking: Booking = await bookingRes.json();

    const patch = eventToBookingPatch({
      id: event.id,
      startDate: event.startDate,
      endDate: event.endDate,
      title: booking.groupName,
      description: booking.purpose,
      color: "blue",
      room: booking.className,
      user: {
        id: booking.bookedByEmail ?? booking.id,
        name: booking.bookedBy ?? "Unknown",
        picturePath: null,
      },
    });

    const res = await fetch(`/api/bookings/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: patch.date,
        startTime: patch.startTime,
        endTime: patch.endTime,
        groupName: booking.groupName,
        className: booking.className,
        purpose: booking.purpose,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 409) {
        toast.error("Booking conflict", {
          description:
            errorData.message ||
            "This room is already booked during this time",
        });
      } else if (res.status === 403) {
        toast.error("Not allowed", {
          description: "You can only reschedule your own bookings",
        });
      } else {
        toast.error("Update failed", {
          description: errorData.message || "Could not update booking",
        });
      }
      throw new Error(errorData.message || "Failed to update booking");
    }

    await afterMutate();
    toast.success("Booking updated", {
      description: "The booking time has been updated",
    });
  };

  return {
    handleCreateSubmit,
    handleEditSubmit,
    handleDelete,
    handleCalendarEventUpdate,
  };
}

/** @deprecated Use useBookingMutations + view-specific fetch hooks instead. */
export function useBookings() {
  return useBookingMutations();
}
