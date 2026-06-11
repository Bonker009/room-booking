"use client";

import { useCallback, useMemo, useState } from "react";
import { Calendar, LayoutGrid, ListFilter } from "lucide-react";

import { BookingDialog, type BookingFormData } from "@/components/booking-dialog";
import { BookingCreatedSuccessDialog } from "@/components/booking-created-success-dialog";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import { BookingCalendar } from "@/components/booking-calendar";
import { BookingsTable } from "@/components/booking-views";
import { BookingTabs } from "@/components/dashboard/booking-tabs";
import { BookingToolbar } from "@/components/dashboard/booking-toolbar";
import { BookingsPagination } from "@/components/dashboard/bookings-pagination";
import { FilterSummary } from "@/components/dashboard/filter-summary";
import { TableEmptyState } from "@/components/dashboard/table-empty-state";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { RoomTimetable } from "@/components/room-timetable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  useCalendarBookings,
  useTodayBookingsCount,
} from "@/hooks/use-calendar-bookings";
import { useBookingsTable } from "@/hooks/use-bookings-table";
import { useBookingMutations } from "@/hooks/use-bookings";
import { authClient } from "@/lib/auth-client";
import { columnFiltersActive } from "@/lib/booking-display";
import {
  formatBookingDate,
  formatBookingTime,
  getBookingStatus,
} from "@/lib/booking-status";
import type {
  Booking,
  BookingDialogPrefill,
  DashboardView,
} from "@/lib/booking-types";
import { buildDuplicatePrefill } from "@/lib/duplicate-booking";
import type { CalendarVisibleRange } from "@/lib/calendar-range";
import { getRoomBadgeColor } from "@/lib/rooms";
import { canManageBooking, sessionUserHasRole } from "@/lib/session-roles";

export default function Home() {
  const [calendarRange, setCalendarRange] = useState<CalendarVisibleRange | null>(
    null,
  );
  const [dashboardView, setDashboardView] = useState<DashboardView>("table");

  const {
    bookings: calendarBookings,
    refetch: refetchCalendar,
  } = useCalendarBookings(calendarRange);

  const table = useBookingsTable();
  const { count: todayCount, refetch: refetchTodayCount } =
    useTodayBookingsCount();

  const refetchActiveView = useCallback(async () => {
    await refetchTodayCount();
    if (dashboardView === "calendar") {
      await refetchCalendar();
    } else {
      await table.refetch();
    }
  }, [
    dashboardView,
    refetchCalendar,
    refetchTodayCount,
    table.refetch,
  ]);

  const {
    handleCreateSubmit,
    handleEditSubmit,
    handleDelete,
    handleCalendarEventUpdate,
    createSuccess,
    dismissCreateSuccess,
  } = useBookingMutations({ onMutated: refetchActiveView });

  const { data: session } = authClient.useSession();

  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [dialogPrefill, setDialogPrefill] =
    useState<BookingDialogPrefill | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const actorEmail = (session?.user?.email ?? "").trim().toLowerCase();
  const isAdmin = sessionUserHasRole(session?.user, "role_admin");
  const canManage = (booking: Booking) =>
    canManageBooking(booking, actorEmail, isAdmin);

  const hasActiveColumnFilters = columnFiltersActive(table.columnFilters);

  const handleVisibleRangeChange = useCallback(
    (startDate: string, endDate: string) => {
      setCalendarRange((prev) => {
        if (prev?.startDate === startDate && prev?.endDate === endDate) {
          return prev;
        }
        return { startDate, endDate };
      });
    },
    [],
  );

  const openCreateDialog = (prefill?: BookingDialogPrefill | null) => {
    setDialogPrefill(prefill ?? null);
    setOpenDialog(true);
  };

  const handleDuplicate = (booking: Booking) => {
    openCreateDialog(buildDuplicatePrefill(booking));
  };

  const handleDeleteBooking = (
    booking: Booking,
    scope: "single" | "series" = "single",
  ) => {
    void handleDelete(booking.id, scope);
  };

  const handleExportCsv = () => {
    const qs = table.exportQueryString;
    window.open(`/api/bookings/export${qs ? `?${qs}` : ""}`, "_blank");
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setOpenEditDialog(true);
  };

  const handleViewDetails = (booking: Booking) => {
    setViewingBooking(booking);
    setOpenDetailsDialog(true);
  };

  const onEditSubmit = async (formData: BookingFormData) => {
    if (!editingBooking) return;
    await handleEditSubmit(formData, editingBooking);
    setEditingBooking(null);
  };

  const fetchBookingById = useCallback(async (id: string) => {
    const res = await fetch(`/api/bookings/${id}`);
    if (!res.ok) return null;
    return res.json() as Promise<Booking>;
  }, []);

  const calendarLookupBookings = useMemo(
    () => calendarBookings,
    [calendarBookings],
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background">
        <DashboardTopBar
          todayCount={todayCount}
          onAddBooking={() => openCreateDialog()}
        />

        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10">
          <Card className="border-none pb-4 pt-0 shadow-lg">
            <CardHeader className="shrink-0 rounded-t-lg bg-gradient-to-r from-muted to-muted/70 pb-3 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl text-primary">
                    Room Bookings
                  </CardTitle>
                  <CardDescription>
                    Manage all your room reservations in one place
                  </CardDescription>
                </div>
                <Tabs
                  value={dashboardView}
                  onValueChange={(value) =>
                    setDashboardView(value as DashboardView)
                  }
                >
                  <TabsList className="scrollbar-brand flex h-auto w-full max-w-full flex-nowrap items-stretch justify-start gap-0 overflow-x-auto">
                    <TabsTrigger value="calendar" className="shrink-0">
                      <Calendar className="mr-1 h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Calendar</span>
                      <span className="sm:hidden">Cal</span>
                    </TabsTrigger>
                    <TabsTrigger value="table" className="shrink-0">
                      <ListFilter className="mr-1 h-4 w-4 shrink-0" />
                      Table
                    </TabsTrigger>
                    <TabsTrigger value="timetable" className="shrink-0">
                      <LayoutGrid className="mr-1 h-4 w-4 shrink-0" />
                      <span className="hidden sm:inline">Timetable</span>
                      <span className="sm:hidden">Time</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent>
              {dashboardView === "timetable" ? (
                <RoomTimetable
                  onBookingClick={(booking) => handleViewDetails(booking)}
                />
              ) : dashboardView === "calendar" ? (
                <BookingCalendar
                  bookings={calendarLookupBookings}
                  onEventUpdate={handleCalendarEventUpdate}
                  onAddBooking={() => openCreateDialog()}
                  onSlotClick={(prefill) => openCreateDialog(prefill)}
                  onVisibleRangeChange={handleVisibleRangeChange}
                  onViewBooking={async (id) => {
                    const booking =
                      calendarLookupBookings.find((b) => b.id === id) ??
                      (await fetchBookingById(id));
                    if (booking) handleViewDetails(booking);
                  }}
                  onEditBooking={async (id) => {
                    const booking =
                      calendarLookupBookings.find((b) => b.id === id) ??
                      (await fetchBookingById(id));
                    if (booking) handleEdit(booking);
                  }}
                />
              ) : (
                <>
                  <BookingToolbar
                    filter={table.search}
                    onFilterChange={table.setSearch}
                    dateRangeFilter={table.dateRangeFilter}
                    onDateRangeChange={table.setDateRangeFilter}
                    roomFilter={table.roomFilter}
                    onRoomFilterChange={table.setRoomFilter}
                    onClearAll={table.clearAllFilters}
                    showClearAll={table.hasToolbarFilters}
                    onExportCsv={handleExportCsv}
                  />
                  <BookingTabs
                    activeTab={table.activeTab}
                    onTabChange={table.setActiveTab}
                  />
                  {!table.isLoading && (
                    <FilterSummary
                      displayedCount={table.total}
                      filteredCount={table.total}
                      totalCount={table.total}
                      filter={table.search}
                      dateRangeFilter={table.dateRangeFilter}
                      roomFilter={table.roomFilter}
                      hasToolbarFilters={table.hasToolbarFilters}
                      hasActiveColumnFilters={hasActiveColumnFilters}
                      onClearColumnFilters={table.clearColumnFilters}
                    />
                  )}
                  {table.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : (
                    <>
                      <BookingsTable
                        displayedBookings={table.rows}
                        rowOffset={table.rowOffset}
                        sortFilter={{
                          sortColumn: table.sortColumn,
                          sortDirection: table.sortDirection,
                          onSortClick: table.handleSortClick,
                          columnFilters: table.columnFilters,
                          onColumnFiltersUpdate: table.onColumnFiltersUpdate,
                          onClearColumnFilter: table.onClearColumnFilter,
                        }}
                        canManageBooking={canManage}
                        emptyState={
                          table.rows.length === 0 ? (
                            <TableEmptyState
                              variant={
                                hasActiveColumnFilters
                                  ? "no-rows"
                                  : "no-bookings"
                              }
                              hasToolbarFilters={table.hasToolbarFilters}
                              onClearColumnFilters={table.clearColumnFilters}
                              onClearAllFilters={table.clearAllFilters}
                              onCreateBooking={() => openCreateDialog()}
                            />
                          ) : undefined
                        }
                        formatDate={formatBookingDate}
                        formatTime={formatBookingTime}
                        getBookingStatus={getBookingStatus}
                        getClassBadgeColor={getRoomBadgeColor}
                        onViewDetails={handleViewDetails}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDeleteBooking}
                      />
                      <BookingsPagination
                        page={table.page}
                        totalPages={table.totalPages}
                        totalItems={table.total}
                        startIndex={table.startIndex}
                        endIndex={table.endIndex}
                        pageSize={table.pageSize}
                        onPageChange={table.setPage}
                        onPageSizeChange={table.setPageSize}
                      />
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>

        <BookingDialog
          open={openDialog}
          onOpenChange={(open) => {
            setOpenDialog(open);
            if (!open) setDialogPrefill(null);
          }}
          onSubmit={handleCreateSubmit}
          prefill={dialogPrefill}
        />

        <BookingDialog
          open={openEditDialog}
          onOpenChange={setOpenEditDialog}
          onSubmit={onEditSubmit}
          editingBooking={editingBooking}
        />

        <BookingDetailsDialog
          open={openDetailsDialog}
          onOpenChange={setOpenDetailsDialog}
          booking={viewingBooking}
          onDuplicate={handleDuplicate}
        />

        <BookingCreatedSuccessDialog
          open={createSuccess !== null}
          onOpenChange={(open) => {
            if (!open) dismissCreateSuccess();
          }}
          success={createSuccess}
        />
      </div>
    </TooltipProvider>
  );
}
