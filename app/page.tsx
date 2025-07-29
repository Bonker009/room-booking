"use client";

import { useState, useEffect } from "react";
import {
  CalendarIcon,
  Clock,
  Search,
  Trash2,
  Users,
  BookOpen,
  Plus,
  X,
  Filter,
  Edit,
  Calendar,
  LayoutDashboard,
  CalendarDays,
  CreditCard,
  PersonStandingIcon,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { BookingDialog } from "@/components/booking-dialog";
import { cn } from "@/lib/utils";

// Type definitions
interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy: string;
}

interface FormData {
  date: Date | undefined;
  startTime: string;
  endTime: string;
  groupName: string;
  className: string;
  bookedBy: string;
}

export default function Home() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("today"); // Default to today
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter bookings when filter or bookings change
  useEffect(() => {
    filterBookings();
  }, [filter, dateFilter, roomFilter, bookings, activeTab]);

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

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by search term
    if (filter) {
      filtered = filtered.filter((b) =>
        [b.date, b.startTime, b.endTime, b.groupName, b.className, b.bookedBy].some((val) =>
          val?.toLowerCase().includes(filter.toLowerCase()),
        ),
      );
    }

    // Filter by specific date
    if (dateFilter) {
      const selectedDate = format(dateFilter, "yyyy-MM-dd");
      filtered = filtered.filter((b) => b.date === selectedDate);
    }

    // Filter by room
    if (roomFilter) {
      filtered = filtered.filter((b) => b.className === roomFilter);
    }

    // Filter by tab (only if no specific date filter is applied)
    if (!dateFilter) {
      if (activeTab === "today") {
        const today = new Date().toISOString().split("T")[0];
        filtered = filtered.filter((b) => b.date === today);
      } else if (activeTab === "upcoming") {
        const today = new Date().toISOString().split("T")[0];
        filtered = filtered.filter((b) => b.date > today);
      } else if (activeTab === "past") {
        const today = new Date().toISOString().split("T")[0];
        filtered = filtered.filter((b) => b.date < today);
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
  };

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
          bookedBy: formData.bookedBy,
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
          bookedBy: formData.bookedBy,
        }),
      });

      if (res.ok) {
        const updatedBooking = await res.json();
        setBookings((prev) =>
          prev.map((b) =>
            b.id === updatedBooking.id ? { ...b, ...updatedBooking } : b,
          ),
        );
        setEditingBooking(null);

        // Refresh bookings from server
        await fetchBookings();

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

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setOpenEditDialog(true);
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
    setDateFilter(undefined);
    setRoomFilter("");
    setActiveTab("all");
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
        Number.parseInt(startMinutes, 10),
      );

      const endTime = new Date(bookingDate);
      const [endHours, endMinutes] = booking.endTime.split(":");
      endTime.setHours(
        Number.parseInt(endHours, 10),
        Number.parseInt(endMinutes, 10),
      );

      if (now < startTime) {
        return { label: "Upcoming", color: "bg-blue-100 text-blue-800" };
      } else if (now >= startTime && now <= endTime) {
        return { label: "In Progress", color: "bg-green-100 text-green-800" };
      } else {
        return { label: "Completed", color: "bg-gray-100 text-gray-800" };
      }
    } catch (e) {
      return { label: "Unknown", color: "bg-gray-100 text-gray-800" };
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

    return classColors[className] || "bg-gray-100 text-gray-800";
  };

  const getTodayBookingsCount = () => {
    const today = new Date().toISOString().split("T")[0];
    return bookings.filter((b) => b.date === today).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-sky-600 mr-2" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Room Booking System
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-sky-600 hover:text-sky-800"
              >
                <LayoutDashboard className="h-4 w-4 mr-1" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/founder"
                className="flex items-center text-sky-600 hover:text-sky-800"
              >
                <PersonStandingIcon className="h-4 w-4 mr-1" />
                <span>Founder</span>
              </Link>
              <Link
                href="/subscription"
                className="flex items-center text-sky-600 hover:text-sky-800"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                <span>Subscription</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Summary Card */}
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-sky-500 to-indigo-500 text-white border-none shadow-lg">
            <CardContent className=" ">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                  <Calendar className="h-10 w-10 mr-4" />
                  <div>
                    <h2 className="text-2xl font-bold">
                      {format(new Date(), "EEEE, MMMM d, yyyy")}
                    </h2>
                    <p className="text-sky-100">
                      {getTodayBookingsCount()} booking
                      {getTodayBookingsCount() !== 1 ? "s" : ""} scheduled for
                      today
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setOpenDialog(true)}
                  variant="secondary"
                  className="bg-white text-sky-600 hover:bg-sky-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg pt-0 pb-4">
          <CardHeader className="pb-3 bg-gradient-to-r from-sky-50 to-indigo-50 rounded-t-lg pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-sky-700 text-2xl">
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
                    className="pl-10 w-full sm:w-[250px] border-sky-200 focus-visible:ring-sky-500"
                    value={filter}
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

                {/* Date Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal border-sky-200 hover:bg-sky-50",
                        !dateFilter && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Room Filter */}
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] border-sky-200 focus:ring-sky-500">
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
                {(filter || dateFilter || roomFilter) && (
                  <Button
                    variant="outline"
                    className="h-10 px-3 border-sky-200 hover:bg-sky-50 text-sm"
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
                <TabsList className="w-full bg-sky-50 p-1 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-1">
                  <TabsTrigger
                    value="today"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center justify-center py-2"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>Today</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="upcoming"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center justify-center py-2"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    <span>Upcoming</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="past"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center justify-center py-2"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Past</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white rounded-lg transition-all duration-200 flex items-center justify-center py-2"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    <span>All Bookings</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Filter Summary */}
            {!isLoading && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {filteredBookings.length} of {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                  {(filter || dateFilter || roomFilter) && (
                    <span className="ml-1 text-sky-600 font-medium">
                      (filtered)
                    </span>
                  )}
                </p>
                {(filter || dateFilter || roomFilter) && (
                  <div className="flex items-center gap-2 text-xs">
                    {filter && (
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                        Search: "{filter}"
                      </Badge>
                    )}
                    {dateFilter && (
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                        Date: {format(dateFilter, "MMM d, yyyy")}
                      </Badge>
                    )}
                    {roomFilter && (
                      <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                        Room: {roomFilter}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              </div>
            ) : (
              <>
                {filteredBookings.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border border-sky-100">
                    <table className="min-w-full divide-y divide-sky-200">
                      <thead className="bg-sky-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">
                            Group
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">
                            Room
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">
                            Book By
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-sky-700 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-sky-100">
                        {filteredBookings.map((booking) => {
                          const status = getBookingStatus(booking);
                          return (
                            <tr
                              key={booking.id}
                              className="hover:bg-sky-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2 text-sky-500" />
                                  <span>{formatDate(booking.date)}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-sky-500" />
                                  <span>
                                    {formatTime(booking.startTime)} -{" "}
                                    {formatTime(booking.endTime)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-sky-500" />
                                  <span className="font-medium">
                                    {booking.groupName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className={getClassBadgeColor(
                                    booking.className,
                                  )}
                                >
                                  {booking.className}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  variant="outline"
                                  className={status.color}
                                >
                                  {status.label}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <PersonStandingIcon className="h-4 w-4 mr-2 text-sky-500" />
                                  <span className="font-medium">
                                    {booking.bookedBy || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-sky-500 hover:text-sky-700 hover:bg-sky-50"
                                    onClick={() => handleEdit(booking)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Booking
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this
                                          booking? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDelete(booking.id)
                                          }
                                          className="bg-red-500 hover:bg-red-600"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-sky-50 rounded-md border border-sky-100">
                    <Filter className="h-12 w-12 mx-auto text-sky-400 mb-3" />
                    <h3 className="text-lg font-medium text-sky-700">
                      No bookings found
                    </h3>
                    <p className="text-sky-600 mt-1">
                      {filter
                        ? "Try adjusting your search or filters"
                        : "Create your first booking to get started"}
                    </p>
                    {!filter && (
                      <Button
                        className="mt-4 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600"
                        onClick={() => setOpenDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Booking
                      </Button>
                    )}
                  </div>
                )}
              </>
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
    </div>
  );
}
