"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock, Users, Building2, PersonStandingIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (bookingData: BookingFormData) => Promise<void>
  existingBookings: Booking[]
  editingBooking?: Booking | null
}

interface BookingFormData {
  date: Date | undefined
  startTime: string
  endTime: string
  groupName: string
  className: string
  bookedBy: string
  purpose: string
}

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

export function BookingDialog({
  open,
  onOpenChange,
  onSubmit,
  existingBookings,
  editingBooking = null,
}: BookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [groupName, setGroupName] = useState("")
  const [room, setRoom] = useState("")
  const [bookedBy, setBookedBy] = useState("")
  const [purpose, setPurpose] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form when editing
  useEffect(() => {
    if (editingBooking) {
      setDate(new Date(editingBooking.date))
      setStartTime(editingBooking.startTime)
      setEndTime(editingBooking.endTime)
      setGroupName(editingBooking.groupName)
      setRoom(editingBooking.className)
      setBookedBy(editingBooking.bookedBy || "")
      setPurpose(editingBooking.purpose || "")
    } else {
      // Set default values for new booking
      const now = new Date()
      setDate(now)
      // Default to next hour, rounded to nearest 30 min
      const hours = now.getHours()
      const minutes = now.getMinutes() >= 30 ? 0 : 30
      const nextHour = minutes === 0 ? hours + 1 : hours
      setStartTime(`${nextHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
      setEndTime(`${(nextHour + 1).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
      setGroupName("")
      setRoom("")
      setBookedBy("")
      setPurpose("")
    }
  }, [editingBooking, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!date) newErrors.date = "Please select a date"
    if (!startTime) newErrors.startTime = "Please select a start time"
    if (!endTime) newErrors.endTime = "Please select an end time"
    if (!groupName.trim()) newErrors.groupName = "Please enter a group name"
    if (!room) newErrors.room = "Please select a room"
    if (!bookedBy.trim()) newErrors.bookedBy = "Please enter who is booking this room"
    if (!purpose.trim()) newErrors.purpose = "Please enter the purpose of booking"

    // Validate time format and logic
    if (startTime && endTime) {
      if (startTime >= endTime) {
        newErrors.endTime = "End time must be after start time"
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
      })
      if (hasConflict) {
        newErrors.conflict = "This room is already booked during this time"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const checkBookingConflicts = (booking: any): boolean => {
    // Skip checking against the booking we're currently editing
    const bookingsToCheck = editingBooking
      ? existingBookings.filter((b) => b.id !== editingBooking.id)
      : existingBookings

    // Convert form date to string format for comparison
    const bookingDateStr = format(booking.date, "yyyy-MM-dd")

    for (const existingBooking of bookingsToCheck) {
      // Only check bookings for the same room and date
      if (existingBooking.className === booking.className && existingBooking.date === bookingDateStr) {
        // Check for time overlap
        if (
          (booking.startTime >= existingBooking.startTime && booking.startTime < existingBooking.endTime) ||
          (booking.endTime > existingBooking.startTime && booking.endTime <= existingBooking.endTime) ||
          (booking.startTime <= existingBooking.startTime && booking.endTime >= existingBooking.endTime)
        ) {
          return true // Conflict found
        }
      }
    }
    return false // No conflicts
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        date,
        startTime,
        endTime,
        groupName,
        className: room,
        bookedBy,
        purpose,
      })
      // Reset form
      if (!editingBooking) {
        setDate(new Date())
        setStartTime("")
        setEndTime("")
        setGroupName("")
        setRoom("")
        setBookedBy("")
        setPurpose("")
      }
      onOpenChange(false)
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save booking. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = (i % 2) * 30
    const formattedHour = hour.toString().padStart(2, "0")
    const formattedMinute = minute.toString().padStart(2, "0")
    const time = `${formattedHour}:${formattedMinute}`
    // Format for display (12-hour format)
    const hour12 = hour % 12 || 12
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayTime = `${hour12}:${formattedMinute} ${ampm}`
    return { value: time, label: displayTime }
  })

  const formatTimeForDisplay = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":").map(Number)
    const hour12 = hours % 12 || 12
    const ampm = hours >= 12 ? "PM" : "AM"
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        <div className="bg-gradient-to-r from-primary to-[#003d6b] p-6 text-primary-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingBooking ? "Edit Booking" : "Create New Booking"}
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/85 mt-1">
              {editingBooking
                ? "Update the details of your room reservation"
                : "Fill in the details to book a room for your event"}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              {/* Date + Room */}
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
                        errors.date ? "border-destructive" : "border-input",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {date ? format(date, "PPP") : "Select a date"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="room" className="text-sm font-medium">
                  Room
                </Label>
                <Select value={room} onValueChange={setRoom}>
                  <SelectTrigger
                    id="room"
                    className={cn(errors.room ? "border-destructive w-full" : "border-input w-full")}
                  >
                    <div className="flex min-w-0 items-center">
                      <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
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
                {errors.room && <p className="text-sm text-destructive">{errors.room}</p>}
              </div>

              {/* Start / End time */}
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Start Time
                </Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger
                    id="startTime"
                    className={cn(errors.startTime ? "border-destructive w-full" : "border-input w-full")}
                  >
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      <SelectValue placeholder="Select time">
                        {startTime ? formatTimeForDisplay(startTime) : "Select time"}
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
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">
                  End Time
                </Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger
                    id="endTime"
                    className={cn(errors.endTime ? "border-destructive w-full" : "border-input w-full")}
                  >
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
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
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}
              </div>

              {/* Group name + Booked by */}
              <div className="space-y-2">
                <Label htmlFor="groupName" className="text-sm font-medium">
                  Group Name
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="groupName"
                    placeholder="Enter group name"
                    className={cn("pl-10", errors.groupName ? "border-destructive" : "border-input")}
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                {errors.groupName && <p className="text-sm text-destructive">{errors.groupName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bookedBy" className="text-sm font-medium">
                  Booked By
                </Label>
                <div className="relative">
                  <PersonStandingIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bookedBy"
                    placeholder="Enter name of person booking"
                    className={cn("pl-10", errors.bookedBy ? "border-destructive" : "border-input")}
                    value={bookedBy}
                    onChange={(e) => setBookedBy(e.target.value)}
                  />
                </div>
                {errors.bookedBy && <p className="text-sm text-destructive">{errors.bookedBy}</p>}
              </div>

              {/* Purpose — full width */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="purpose" className="text-sm font-medium">
                  Purpose
                </Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="purpose"
                    maxLength={90}
                    placeholder="Purpose (e.g. meeting, training, workshop)"
                    className={cn(
                      "min-h-[4.25rem] resize-y pl-10 break-words whitespace-pre-wrap [overflow-wrap:anywhere]",
                      errors.purpose ? "border-destructive" : "border-input",
                    )}
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
                  />
                </div>
                {errors.purpose && <p className="text-sm text-destructive">{errors.purpose}</p>}
              </div>

              {errors.conflict && (
                <div className="sm:col-span-2 flex items-start rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-destructive">
                  <div className="mr-2 mt-0.5 shrink-0">⚠️</div>
                  <div>
                    <p className="font-medium">Booking Conflict</p>
                    <p className="text-sm">{errors.conflict}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-primary to-[#003d6b] hover:opacity-95 text-primary-foreground"
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
  )
}
