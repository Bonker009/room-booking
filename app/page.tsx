"use client";
import { useState, useEffect, useCallback } from "react";
import {
  CalendarIcon,
  Clock,
  Search,
  BookOpen,
  Plus,
  X,
  Filter,
  Calendar,
  LayoutDashboard,
  ListFilter,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { DateRangePicker } from "@/components/date-range-picker";
import type { DateRangeValue } from "@/components/date-range-picker";
import { BookingDialog } from "@/components/booking-dialog";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import { BookingsTable } from "@/components/booking-views";
import {
  columnFiltersActive,
  computeDisplayedBookings,
  type ColumnKey,
  type TableColumnFilterState,
} from "@/lib/booking-display";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { UserMenu } from "@/components/user-menu";

// Type definitions
interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy: string;
  bookedByEmail?: string;
  purpose: string;
}

interface FormData {
  date: Date | undefined;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  purpose: string;
}

export default function Home() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    DateRangeValue | undefined
  >(undefined);
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState("today");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<TableColumnFilterState>(
    {},
  );

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bookings");
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        toast.error("Error fetching bookings", {
          description: "Please try again later",
        });
      }
    } catch (error) {
      toast.error("Network error", {
        description: "Could not connect to the server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = useCallback(() => {
    let filtered = bookings;
    // Filter by search term
    if (filter) {
      filtered = filtered.filter((b) =>
        [
          b.date,
          b.startTime,
          b.endTime,
          b.groupName,
          b.className,
          b.bookedBy,
          b.bookedByEmail,
          b.purpose,
        ]
          .filter(Boolean)
          .some((val) =>
            String(val).toLowerCase().includes(filter.toLowerCase()),
          )
      );
    }
    const hasToolbarDateRange = Boolean(
      dateRangeFilter?.from || dateRangeFilter?.to,
    );
    if (hasToolbarDateRange) {
      const fromIso = dateRangeFilter?.from
        ? format(dateRangeFilter.from, "yyyy-MM-dd")
        : undefined;
      const toIso = dateRangeFilter?.to
        ? format(dateRangeFilter.to, "yyyy-MM-dd")
        : undefined;
      filtered = filtered.filter((b) => {
        if (fromIso && toIso) {
          return b.date >= fromIso && b.date <= toIso;
        }
        if (fromIso) return b.date >= fromIso;
        if (toIso) return b.date <= toIso;
        return true;
      });
    }
    // Filter by room
    if (roomFilter) {
      filtered = filtered.filter((b) => b.className === roomFilter);
    }
    // Filter by tab (only if no toolbar date range is applied)
    if (!hasToolbarDateRange) {
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];

      if (activeTab === "today") {
        filtered = filtered.filter((b) => b.date === todayStr);
      } else if (activeTab === "upcoming") {
        filtered = filtered.filter((b) => {
          if (b.date > todayStr) return true;
          if (b.date < todayStr) return false;
          // If booking is today, check if its end time is in the future
          const [endHour, endMin] = b.endTime.split(":").map(Number);
          const bookingEnd = new Date(b.date);
          bookingEnd.setHours(endHour, endMin, 0, 0);
          return bookingEnd > now;
        });
      } else if (activeTab === "past") {
        filtered = filtered.filter((b) => {
          if (b.date < todayStr) return true;
          if (b.date > todayStr) return false;
          // If booking is today, check if its end time is in the past
          const [endHour, endMin] = b.endTime.split(":").map(Number);
          const bookingEnd = new Date(b.date);
          bookingEnd.setHours(endHour, endMin, 0, 0);
          return bookingEnd <= now;
        });
      }
    }

    // Sort by date and time
    filtered = [...filtered].sort((a, b) => {
      // First sort by date
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      // If same date, sort by start time
      return a.startTime.localeCompare(b.startTime);
    });
    setFilteredBookings(filtered);
  }, [bookings, filter, dateRangeFilter, roomFilter, activeTab]);

  // Filter bookings when filter or bookings change
  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const handleCreateSubmit = async (formData: FormData) => {
    try {
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
        const newBooking = await res.json();
        setBookings((prev) => [newBooking, ...prev]);
        // Refresh bookings from server
        await fetchBookings();
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

  const handleEditSubmit = async (formData: FormData) => {
    if (!editingBooking) return;
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
        const updatedBooking = await res.json();
        setBookings((prev) =>
          prev.map((b) =>
            b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b
          )
        );
        setEditingBooking(null);
        // Refresh bookings from server
        await fetchBookings();
        toast.success("Booking updated", {
          description: `Room booking for ${format(
            new Date(dateString),
            "PPP"
          )} has been updated`,
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

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setOpenEditDialog(true);
  };

  const handleViewDetails = (booking: Booking) => {
    setViewingBooking(booking);
    setOpenDetailsDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (result.ok) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        toast.success("Booking deleted", {
          description: "The booking has been removed successfully",
        });
      } else {
        toast.error("Failed to delete", {
          description: "Could not delete the booking",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    }
  };

  const clearAllFilters = () => {
    setFilter("");
    setDateRangeFilter(undefined);
    setRoomFilter("");
    setActiveTab("all");
    setColumnFilters({});
    setSortColumn(null);
    setSortDirection("asc");
  };

  const clearColumnFilters = () => {
    setColumnFilters({});
  };

  const handleSortClick = (col: ColumnKey) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const onColumnFiltersUpdate = (
    updater: (prev: TableColumnFilterState) => TableColumnFilterState,
  ) => {
    setColumnFilters(updater);
  };

  const onClearColumnFilter = (key: ColumnKey) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      switch (key) {
        case "date":
          delete next.date;
          break;
        case "time":
          delete next.time;
          break;
        case "group":
          delete next.group;
          break;
        case "room":
          delete next.room;
          break;
        case "status":
          delete next.status;
          break;
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Convert 24-hour format to 12-hour format
      const [hours, minutes] = timeString.split(":");
      const hour = Number.parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  const getBookingStatus = (booking: Booking) => {
    try {
      const bookingDate = parseISO(booking.date);
      const now = new Date();
      const startTime = new Date(bookingDate);
      const [startHours, startMinutes] = booking.startTime.split(":");
      startTime.setHours(
        Number.parseInt(startHours, 10),
        Number.parseInt(startMinutes, 10)
      );
      const endTime = new Date(bookingDate);
      const [endHours, endMinutes] = booking.endTime.split(":");
      endTime.setHours(
        Number.parseInt(endHours, 10),
        Number.parseInt(endMinutes, 10)
      );
      if (now < startTime) {
        return { label: "Upcoming", color: "bg-chart-5/15 text-chart-5" };
      } else if (now >= startTime && now <= endTime) {
        return { label: "In Progress", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" };
      } else {
        return { label: "Completed", color: "bg-muted text-muted-foreground" };
      }
    } catch (e) {
      return { label: "Unknown", color: "bg-muted text-muted-foreground" };
    }
  };

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
    };
    return classColors[className] || "bg-muted text-muted-foreground";
  };

  const getTodayBookingsCount = () => {
    const today = new Date().toISOString().split("T")[0];
    return bookings.filter((b) => b.date === today).length;
  };

  const displayedBookings = computeDisplayedBookings(
    filteredBookings,
    columnFilters,
    sortColumn,
    sortDirection,
    (b) => getBookingStatus(b).label,
  );

  const hasActiveColumnFilters = columnFiltersActive(columnFilters);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-[0_1px_3px_rgb(0_81_141/0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className={cn(
                "flex min-w-0 items-center gap-3 rounded-md py-1 pr-2 outline-none",
                "transition-opacity hover:opacity-90",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <Image
                src="/kshrd-logo.png"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 shrink-0 object-contain"
                priority
              />
              <span className="bg-border h-8 w-px shrink-0" aria-hidden />
              <div className="min-w-0 leading-tight">
                <h1 className="text-primary truncate text-lg font-semibold tracking-tight sm:text-xl">
                  Room Booking System
                </h1>
                <p className="text-muted-foreground truncate text-xs font-normal">
                  KSHRD · Room booking
                </p>
              </div>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center text-primary hover:text-primary/85"
              >
                <LayoutDashboard className="h-4 w-4 mr-1" />
                <span>Dashboard</span>
              </Link>
              <UserMenu />
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Summary Card */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-primary to-[#003d6b] text-primary-foreground border-none shadow-[0_4px_20px_-4px_rgb(0_81_141/0.35)]">
            <CardContent className=" ">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                  <Calendar className="h-10 w-10 mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold">
                      {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </h2>
                    <p className="text-primary-foreground/85">
                      {getTodayBookingsCount()} booking
                      {getTodayBookingsCount() !== 1 ? "s" : ""} scheduled for
                      today
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setOpenDialog(true)}
                  variant="secondary"
                  className="bg-card text-primary hover:bg-muted"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg pt-0 pb-4">
          <CardHeader className="pb-3 bg-gradient-to-r from-muted to-muted/70 rounded-t-lg pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-primary text-2xl">
                  Room Bookings
                </CardTitle>
                <CardDescription>
                  Manage all your room reservations in one place
                </CardDescription>
              </div>
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    className="pl-10 w-full sm:w-[250px] border-primary/20 focus-visible:ring-primary/35"
                    value={filter}
                    maxLength={20}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  {filter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1.5 h-7 w-7"
                      onClick={() => setFilter("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <DateRangePicker
                  date={dateRangeFilter}
                  onDateChange={setDateRangeFilter}
                  placeholder="Pick a date"
                  fieldClassName="w-full sm:w-auto"
                  buttonClassName="w-full min-w-[220px] justify-start border-primary/20 hover:bg-muted sm:w-[260px]"
                />
                {/* Room Filter */}
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] border-primary/20 focus:ring-primary/35">
                    <div className="flex items-center">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Filter by room" />
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
                {/* Clear Filters Button */}
                {(filter ||
                  dateRangeFilter?.from ||
                  dateRangeFilter?.to ||
                  roomFilter) && (
                  <Button
                    variant="outline"
                    className="h-10 px-3 border-primary/20 hover:bg-muted text-sm bg-transparent"
                    onClick={clearAllFilters}
                    title="Clear all filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Tabs
                defaultValue="today"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="h-auto w-full flex flex-nowrap items-stretch justify-start gap-0 overflow-x-auto overflow-y-hidden rounded-none border-0 border-b border-border bg-transparent p-0 text-foreground scrollbar-brand">
                  <TabsTrigger
                    value="today"
                    className="shrink-0 min-h-10 flex-none items-center justify-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors duration-200 ease-out hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    <span>Today</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="upcoming"
                    className="shrink-0 min-h-10 flex-none items-center justify-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors duration-200 ease-out hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
                  >
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>Upcoming</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="past"
                    className="shrink-0 min-h-10 flex-none items-center justify-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors duration-200 ease-out hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
                  >
                    <Filter className="h-4 w-4 shrink-0" />
                    <span>Past</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="shrink-0 min-h-10 flex-none items-center justify-center gap-1.5 rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors duration-200 ease-out hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent"
                  >
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>All Bookings</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {/* Filter Summary */}
            {!isLoading && (
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {displayedBookings.length} of {filteredBookings.length}{" "}
                  in view
                  {filteredBookings.length !== bookings.length && (
                    <>
                      {" "}
                      ({bookings.length} total in system)
                    </>
                  )}
                  {(filter ||
                  dateRangeFilter?.from ||
                  dateRangeFilter?.to ||
                  roomFilter) && (
                    <span className="ml-1 font-medium text-primary">
                      (filtered)
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {hasActiveColumnFilters && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={clearColumnFilters}
                    >
                      Clear column filters
                    </Button>
                  )}
                  {(filter ||
                  dateRangeFilter?.from ||
                  dateRangeFilter?.to ||
                  roomFilter) && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {filter && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/12 text-primary"
                        >
                          Search: {`"${filter}"`}
                        </Badge>
                      )}
                      {(dateRangeFilter?.from || dateRangeFilter?.to) && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/12 text-primary"
                        >
                          Date:{" "}
                          {dateRangeFilter?.from && dateRangeFilter?.to
                            ? `${format(dateRangeFilter.from, "MMM d, yyyy")} – ${format(dateRangeFilter.to, "MMM d, yyyy")}`
                            : dateRangeFilter?.from
                              ? format(dateRangeFilter.from, "MMM d, yyyy")
                              : dateRangeFilter?.to
                                ? format(dateRangeFilter.to, "MMM d, yyyy")
                                : ""}
                        </Badge>
                      )}
                      {roomFilter && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/12 text-primary"
                        >
                          Room: {roomFilter}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <BookingsTable
                displayedBookings={displayedBookings}
                sortFilter={{
                  sortColumn,
                  sortDirection,
                  onSortClick: handleSortClick,
                  columnFilters,
                  onColumnFiltersUpdate,
                  onClearColumnFilter,
                }}
                emptyState={
                  displayedBookings.length === 0 ? (
                    filteredBookings.length > 0 ? (
                      <div className="text-center">
                        <ListFilter className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-medium text-primary">
                          No rows match column filters
                        </h3>
                        <p className="mt-1 text-muted-foreground">
                          Adjust or clear filters on the table headers.
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4 border-primary/20 text-primary hover:bg-muted"
                          onClick={clearColumnFilters}
                        >
                          Clear column filters
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Filter className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-medium text-primary">
                          No bookings found
                        </h3>
                        <p className="mt-1 text-muted-foreground">
                          {filter ||
                          dateRangeFilter?.from ||
                          dateRangeFilter?.to ||
                          roomFilter
                            ? "No bookings match your current filters. Try adjusting your search criteria."
                            : "Create your first booking to get started"}
                        </p>
                        {filter ||
                        dateRangeFilter?.from ||
                        dateRangeFilter?.to ||
                        roomFilter ? (
                          <Button
                            variant="outline"
                            className="mt-4 border-primary/20 text-primary hover:bg-muted bg-transparent"
                            onClick={clearAllFilters}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Clear All Filters
                          </Button>
                        ) : (
                          <Button
                            className="mt-4 bg-gradient-to-r from-primary to-[#003d6b] hover:opacity-95 text-primary-foreground"
                            onClick={() => setOpenDialog(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Booking
                          </Button>
                        )}
                      </div>
                    )
                  ) : undefined
                }
                formatDate={formatDate}
                formatTime={formatTime}
                getBookingStatus={getBookingStatus}
                getClassBadgeColor={getClassBadgeColor}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Booking Dialog */}
      <BookingDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSubmit={handleCreateSubmit}
        existingBookings={bookings}
      />

      {/* Edit Booking Dialog */}
      <BookingDialog
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
        onSubmit={handleEditSubmit}
        existingBookings={bookings}
        editingBooking={editingBooking}
      />

      {/* View Details Dialog */}
      <BookingDetailsDialog
        open={openDetailsDialog}
        onOpenChange={setOpenDetailsDialog}
        booking={viewingBooking}
      />
    </div>
  );
}
