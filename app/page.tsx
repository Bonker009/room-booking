"use client";

import { useCallback, useMemo, useState } from "react";
import { Calendar, ListFilter } from "lucide-react";

import { BookingDialog, type BookingFormData } from "@/components/booking-dialog";
import { BookingDetailsDialog } from "@/components/booking-details-dialog";
import {
  BookingCalendar,
  type BookingCalendarSlotPrefill,
} from "@/components/booking-calendar";
import { BookingsTable } from "@/components/booking-views";
import { BookingTabs } from "@/components/dashboard/booking-tabs";
import { BookingToolbar } from "@/components/dashboard/booking-toolbar";
import { BookingsPagination } from "@/components/dashboard/bookings-pagination";
import { FilterSummary } from "@/components/dashboard/filter-summary";
import { TableEmptyState } from "@/components/dashboard/table-empty-state";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
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
import type { Booking, DashboardView } from "@/lib/booking-types";
import type { CalendarVisibleRange } from "@/lib/calendar-range";
import { getRoomBadgeColor } from "@/lib/rooms";
import { canManageBooking, sessionUserHasRole } from "@/lib/session-roles";

export default function Home() {
  const [calendarRange, setCalendarRange] = useState<CalendarVisibleRange | null>(
    null,
  );
  const [dashboardView, setDashboardView] = useState<DashboardView>("calendar");

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
  } = useBookingMutations({ onMutated: refetchActiveView });

  const { data: session } = authClient.useSession();

  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [dialogPrefill, setDialogPrefill] =
    useState<BookingCalendarSlotPrefill | null>(null);
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

  const openCreateDialog = (prefill?: BookingCalendarSlotPrefill | null) => {
    setDialogPrefill(prefill ?? null);
    setOpenDialog(true);
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
                  <TabsList>
                    <TabsTrigger value="calendar">
                      <Calendar className="mr-1 h-4 w-4" />
                      Calendar
                    </TabsTrigger>
                    <TabsTrigger value="table">
                      <ListFilter className="mr-1 h-4 w-4" />
                      Table
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent>
              {dashboardView === "calendar" ? (
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
                        onDelete={handleDelete}
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
        />
      </div>
    </TooltipProvider>
  );
}
