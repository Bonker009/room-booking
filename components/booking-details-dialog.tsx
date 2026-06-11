"use client"
import { format } from "date-fns"
import { CalendarIcon, Building2, PersonStandingIcon, FileText, X, Mail, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getRoomBadgeColor } from "@/lib/rooms"
import type { Booking } from "@/lib/booking-types"

interface BookingDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
  onDuplicate?: (booking: Booking) => void
}

export function BookingDetailsDialog({
  open,
  onOpenChange,
  booking,
  onDuplicate,
}: BookingDetailsDialogProps) {
  if (!booking) return null

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, MMMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":")
      const hour = Number.parseInt(hours, 10)
      const ampm = hour >= 12 ? "PM" : "AM"
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    } catch (e) {
      return timeString
    }
  }

  const getClassBadgeColor = getRoomBadgeColor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden rounded-lg p-0 sm:max-w-[720px]">
        <div className="bg-gradient-to-r from-primary to-[#003d6b] p-6 text-primary-foreground">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
                <DialogDescription className="mt-1 text-primary-foreground/85">
                  Complete information about this room reservation
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-primary-foreground hover:bg-primary-foreground/15"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {/* Date and Time Section */}
          <div className="space-y-4">
            <h3 className="flex items-center text-lg font-semibold text-foreground">
              <CalendarIcon className="mr-2 h-5 w-5 text-primary/75" />
              Date & Time
            </h3>
            <div className="space-y-3 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Date:</span>
                <span className="text-right text-sm font-semibold text-foreground tabular-nums">
                  {formatDate(booking.date)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Start Time:</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatTime(booking.startTime)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">End Time:</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {formatTime(booking.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Room and Group Section */}
          <div className="space-y-4">
            <h3 className="flex items-center text-lg font-semibold text-foreground">
              <Building2 className="mr-2 h-5 w-5 text-primary/75" />
              Room & Group
            </h3>
            <div className="space-y-3 rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Room:</span>
                <Badge variant="outline" className={getClassBadgeColor(booking.className)}>
                  {booking.className}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-muted-foreground">Group Name:</span>
                <span className="text-right text-sm font-semibold text-foreground">
                  {booking.groupName}
                </span>
              </div>
            </div>
          </div>

          {/* Purpose Section */}
          <div className="space-y-4 sm:col-span-2">
            <h3 className="flex items-center text-lg font-semibold text-foreground">
              <FileText className="mr-2 h-5 w-5 text-primary/75" />
              Purpose
            </h3>
            <div className="rounded-lg bg-muted p-4">
              <p className="overflow-hidden text-sm leading-relaxed break-words whitespace-pre-wrap text-foreground/90 [overflow-wrap:anywhere]">
                {booking.purpose || "No purpose specified"}
              </p>
            </div>
          </div>

          <Separator className="sm:col-span-2" />

          {/* Booking Information */}
          <div className="space-y-4 sm:col-span-2">
            <h3 className="flex items-center text-lg font-semibold text-foreground">
              <PersonStandingIcon className="mr-2 h-5 w-5 text-primary/75" />
              Booking Information
            </h3>
            <div className="grid gap-3 rounded-lg bg-muted p-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
                <span className="text-sm font-medium text-muted-foreground">Booked By:</span>
                <span className="text-sm font-semibold text-foreground">
                  {booking.bookedBy || "N/A"}
                </span>
              </div>
              {booking.bookedByEmail ? (
                <div className="flex items-start justify-between gap-3 sm:flex-col sm:items-start">
                  <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    Email:
                  </span>
                  <span className="break-all text-sm font-medium text-foreground">
                    {booking.bookedByEmail}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 sm:col-span-2 sm:flex-col sm:items-start">
                <span className="text-sm font-medium text-muted-foreground">Booking ID:</span>
                <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-muted-foreground tabular-nums">
                  {booking.id}
                </span>
              </div>
            </div>
          </div>

          {onDuplicate ? (
            <div className="border-t border-border px-6 py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  onDuplicate(booking)
                  onOpenChange(false)
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Book again (next week)
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
