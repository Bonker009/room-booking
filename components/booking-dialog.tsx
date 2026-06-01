"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Users, Building2, PersonStandingIcon, FileText, CheckCircle2, XCircle } from "lucide-react"
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
import { TimeField } from "@/components/ui/time-field"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { DateRangePicker, type DateRangeValue } from "@/components/date-range-picker"
import { ROOM_OPTIONS } from "@/lib/rooms"
import { authClient } from "@/lib/auth-client"
import type { Booking } from "@/lib/booking-types"
import { useRoomAvailability } from "@/hooks/use-room-availability"
import { Badge } from "@/components/ui/badge"

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (bookingData: BookingFormData) => Promise<void>
  editingBooking?: Booking | null
  prefill?: {
    date?: Date
    startTime?: string
    endTime?: string
  } | null
}

export type BookingMode = "single" | "range"

export interface BookingFormData {
  mode: BookingMode
  date: Date | undefined
  dateRange?: DateRangeValue
  startTime: string
  endTime: string
  groupName: string
  className: string
  purpose: string
}

export function BookingDialog({
  open,
  onOpenChange,
  onSubmit,
  editingBooking = null,
  prefill = null,
}: BookingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingMode, setBookingMode] = useState<BookingMode>("single")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [dateRange, setDateRange] = useState<DateRangeValue | undefined>(undefined)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [groupName, setGroupName] = useState("")
  const [room, setRoom] = useState("")
  const [purpose, setPurpose] = useState("")
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const actorName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0]?.trim() ||
    ""
  const [errors, setErrors] = useState<Record<string, string>>({})

  const {
    availableRooms,
    selectedRoomAvailable,
    rangeConflictDays,
    isLoading: availabilityLoading,
  } = useRoomAvailability({
    open,
    bookingMode,
    date,
    dateRange,
    startTime,
    endTime,
    room,
    excludeId: editingBooking?.id,
  })

  useEffect(() => {
    if (editingBooking) {
      setBookingMode("single")
      setDate(new Date(editingBooking.date))
      setDateRange(undefined)
      setStartTime(editingBooking.startTime)
      setEndTime(editingBooking.endTime)
      setGroupName(editingBooking.groupName)
      setRoom(editingBooking.className)
      setPurpose(editingBooking.purpose || "")
    } else if (prefill) {
      setBookingMode("single")
      setDate(prefill.date ?? new Date())
      setDateRange(undefined)
      setStartTime(prefill.startTime ?? "")
      setEndTime(prefill.endTime ?? "")
      setGroupName("")
      setRoom("")
      setPurpose("")
    } else {
      const now = new Date()
      setBookingMode("single")
      setDate(now)
      setDateRange(undefined)
      const hours = now.getHours()
      const minutes = now.getMinutes() >= 30 ? 0 : 30
      const nextHour = minutes === 0 ? hours + 1 : hours
      setStartTime(`${nextHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
      setEndTime(`${(nextHour + 1).toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
      setGroupName("")
      setRoom("")
      setPurpose("")
    }
  }, [editingBooking, open, prefill])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (bookingMode === "single") {
      if (!date) newErrors.date = "Please select a date"
    } else if (!dateRange?.from || !dateRange?.to) {
      newErrors.dateRange = "Please select a start and end date"
    } else if (dateRange.from > dateRange.to) {
      newErrors.dateRange = "End date must be on or after start date"
    }
    if (!startTime) newErrors.startTime = "Please select a start time"
    if (!endTime) newErrors.endTime = "Please select an end time"
    if (!groupName.trim()) newErrors.groupName = "Please enter a group name"
    if (!room) newErrors.room = "Please select a room"
    if (!purpose.trim()) newErrors.purpose = "Please enter the purpose of booking"

    if (startTime && endTime) {
      if (startTime >= endTime) {
        newErrors.endTime = "End time must be after start time"
      }
    }

    if (!newErrors.endTime && room && startTime && endTime && startTime < endTime) {
      if (bookingMode === "single" && selectedRoomAvailable === false) {
        newErrors.conflict = "This room is already booked during this time"
      } else if (bookingMode === "range" && rangeConflictDays.length > 0) {
        newErrors.conflict = `Room conflicts on ${rangeConflictDays.length} day(s) in this range`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        mode: bookingMode,
        date,
        dateRange: bookingMode === "range" ? dateRange : undefined,
        startTime,
        endTime,
        groupName,
        className: room,
        purpose,
      })
      // Reset form
      if (!editingBooking) {
        setDate(new Date())
        setStartTime("")
        setEndTime("")
        setGroupName("")
        setRoom("")
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        <div className="bg-gradient-to-r from-primary to-[#003d6b] px-5 py-3 text-primary-foreground">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-bold leading-tight">
              {editingBooking ? "Edit Booking" : "Create New Booking"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-snug text-primary-foreground/85">
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
              {!editingBooking && (
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-sm font-medium">Booking type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={bookingMode === "single" ? "default" : "outline"}
                      onClick={() => setBookingMode("single")}
                    >
                      Single day
                    </Button>
                    <Button
                      type="button"
                      variant={bookingMode === "range" ? "default" : "outline"}
                      onClick={() => setBookingMode("range")}
                    >
                      Date range
                    </Button>
                  </div>
                </div>
              )}

              {bookingMode === "single" ? (
                <div className="space-y-2 sm:col-span-2">
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
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
                </div>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={setDateRange}
                    label="Date range"
                    placeholder="Select start and end dates"
                    buttonClassName="w-full"
                  />
                  {errors.dateRange && (
                    <p className="text-sm text-destructive">{errors.dateRange}</p>
                  )}
                </div>
              )}

              {/* Room */}
              <div className="space-y-2 sm:col-span-2">
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
                    {ROOM_OPTIONS.map((roomOption) => (
                      <SelectItem key={roomOption} value={roomOption}>
                        {roomOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.room && <p className="text-sm text-destructive">{errors.room}</p>}
                {room && startTime && endTime && startTime < endTime && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm">
                    {availabilityLoading ? (
                      <span className="text-muted-foreground">Checking availability…</span>
                    ) : selectedRoomAvailable === true ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700 dark:text-emerald-400">{room} is available</span>
                      </>
                    ) : selectedRoomAvailable === false ? (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" />
                        <span className="text-destructive">{room} is busy for this time</span>
                      </>
                    ) : null}
                  </div>
                )}
                {availableRooms.length > 0 && startTime && endTime && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Available rooms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableRooms.map((roomName) => (
                        <Badge
                          key={roomName}
                          variant={room === roomName ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => setRoom(roomName)}
                        >
                          {roomName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Start / End time */}
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Start Time
                </Label>
                <TimeField
                  id="startTime"
                  value={startTime}
                  onChange={setStartTime}
                  hasError={Boolean(errors.startTime)}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium">
                  End Time
                </Label>
                <TimeField
                  id="endTime"
                  value={endTime}
                  onChange={setEndTime}
                  hasError={Boolean(errors.endTime)}
                />
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
                <Label className="text-sm font-medium">Booked by (your Keycloak account)</Label>
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">
                  {sessionPending ? (
                    <span className="text-muted-foreground">Loading account…</span>
                  ) : (
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <PersonStandingIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {actorName || "—"}
                    </div>
                  )}
                </div>
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
              disabled={
                isSubmitting ||
                sessionPending ||
                (!sessionPending && !session?.user)
              }
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
