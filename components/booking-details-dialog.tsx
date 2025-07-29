"use client"
import { format } from "date-fns"
import { CalendarIcon, Building2, PersonStandingIcon, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Booking {
  id: string
  date: string
  startTime: string
  endTime: string
  groupName: string
  className: string
  bookedBy: string
  purpose: string
}

interface BookingDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
}

export function BookingDetailsDialog({ open, onOpenChange, booking }: BookingDetailsDialogProps) {
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

  const getClassBadgeColor = (className: string) => {
    const classColors: Record<string, string> = {
      BTB: "bg-purple-100 text-purple-800",
      SR: "bg-emerald-100 text-emerald-800",
      PP: "bg-indigo-100 text-indigo-800",
      KPS: "bg-amber-100 text-amber-800",
      PVH: "bg-rose-100 text-rose-800",
      Seminar: "bg-cyan-100 text-cyan-800",
      "Koh Kong": "bg-red-100 text-red-800",
      "Director Room": "bg-slate-100 text-slate-800",
      "Deputy Director Room": "bg-orange-100 text-orange-800",
    }
    return classColors[className] || "bg-gray-100 text-gray-800"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg">
        <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-6 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
                <DialogDescription className="text-sky-100 mt-1">
                  Complete information about this room reservation
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Date and Time Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-sky-500" />
              Date & Time
            </h3>
            <div className="bg-sky-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Date:</span>
                <span className="text-sm font-semibold text-gray-900">{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Start Time:</span>
                <span className="text-sm font-semibold text-gray-900">{formatTime(booking.startTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">End Time:</span>
                <span className="text-sm font-semibold text-gray-900">{formatTime(booking.endTime)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Room and Group Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-sky-500" />
              Room & Group
            </h3>
            <div className="bg-sky-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Room:</span>
                <Badge variant="outline" className={getClassBadgeColor(booking.className)}>
                  {booking.className}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Group Name:</span>
                <span className="text-sm font-semibold text-gray-900">{booking.groupName}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Purpose Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-sky-500" />
              Purpose
            </h3>
            <div className="bg-sky-50 rounded-lg p-4">
              <p
                className="text-sm text-gray-700 leading-relaxed break-all whitespace-pre-wrap word-break-break-all overflow-hidden"
                style={{
                  wordBreak: "break-all",
                  overflowWrap: "anywhere",
                  whiteSpace: "pre-wrap",
                  maxWidth: "100%",
                }}
              >
                {booking.purpose || "No purpose specified"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Booking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PersonStandingIcon className="h-5 w-5 mr-2 text-sky-500" />
              Booking Information
            </h3>
            <div className="bg-sky-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Booked By:</span>
                <span className="text-sm font-semibold text-gray-900">{booking.bookedBy || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Booking ID:</span>
                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{booking.id}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
