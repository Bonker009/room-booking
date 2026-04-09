"use client";

import type { ReactNode } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRangePickerInline } from "@/components/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type {
  BookingDisplayModel,
  ColumnKey,
  TableColumnFilterState,
} from "@/lib/booking-display";
import {
  TABLE_ROOM_OPTIONS,
  TABLE_STATUS_OPTIONS,
  getTableTimeSlotOptions,
} from "@/lib/booking-display";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarIcon,
  Clock,
  Edit,
  Eye,
  ListFilter,
  Trash2,
  Users,
} from "lucide-react";

export type { BookingDisplayModel };

interface SharedProps {
  formatDate: (dateString: string) => string;
  formatTime: (timeString: string) => string;
  getBookingStatus: (booking: BookingDisplayModel) => {
    label: string;
    color: string;
  };
  getClassBadgeColor: (className: string) => string;
  onViewDetails: (booking: BookingDisplayModel) => void;
  onEdit: (booking: BookingDisplayModel) => void;
  onDelete: (id: string) => void;
}

const TIME_SLOT_OPTIONS = getTableTimeSlotOptions();

interface SortFilterProps {
  sortColumn: ColumnKey | null;
  sortDirection: "asc" | "desc";
  onSortClick: (col: ColumnKey) => void;
  columnFilters: TableColumnFilterState;
  onColumnFiltersUpdate: (
    updater: (prev: TableColumnFilterState) => TableColumnFilterState,
  ) => void;
  onClearColumnFilter: (key: ColumnKey) => void;
}

function columnFilterIsActive(
  col: ColumnKey,
  filters: TableColumnFilterState,
): boolean {
  switch (col) {
    case "date":
      return Boolean(filters.date?.from?.trim() || filters.date?.to?.trim());
    case "time":
      return Boolean(
        filters.time?.startFrom?.trim() || filters.time?.endBy?.trim(),
      );
    case "group":
      return Boolean(filters.group?.trim());
    case "room":
      return Boolean(filters.room?.trim());
    case "status":
      return Boolean(filters.status?.trim());
    default:
      return false;
  }
}

function SortChevron({
  col,
  sortColumn,
  sortDirection,
}: {
  col: ColumnKey;
  sortColumn: ColumnKey | null;
  sortDirection: "asc" | "desc";
}) {
  if (sortColumn !== col) {
    return (
      <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    );
  }
  return sortDirection === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" />
  );
}

function ColumnFilterControl({
  col,
  columnFilters,
  onColumnFiltersUpdate,
  onClearColumnFilter,
}: {
  col: ColumnKey;
  columnFilters: TableColumnFilterState;
  onColumnFiltersUpdate: SortFilterProps["onColumnFiltersUpdate"];
  onClearColumnFilter: (key: ColumnKey) => void;
}) {
  const active = columnFilterIsActive(col, columnFilters);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-7 w-7 shrink-0",
            active && "text-primary",
          )}
          aria-label={`Filter ${col}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilter className="h-3.5 w-3.5" />
          {active && (
            <span className="bg-primary absolute top-1 right-1 h-1.5 w-1.5 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "max-h-[min(480px,70vh)] overflow-y-auto p-3",
          col === "date" ? "w-auto max-w-[calc(100vw-2rem)]" : "w-64",
        )}
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {col === "date" && (
          <DateColumnFilterBody
            columnFilters={columnFilters}
            onColumnFiltersUpdate={onColumnFiltersUpdate}
            onClear={() => onClearColumnFilter("date")}
          />
        )}
        {col === "time" && (
          <TimeColumnFilterBody
            columnFilters={columnFilters}
            onColumnFiltersUpdate={onColumnFiltersUpdate}
            onClear={() => onClearColumnFilter("time")}
          />
        )}
        {col === "group" && (
          <GroupColumnFilterBody
            columnFilters={columnFilters}
            onColumnFiltersUpdate={onColumnFiltersUpdate}
            onClear={() => onClearColumnFilter("group")}
          />
        )}
        {col === "room" && (
          <RoomColumnFilterBody
            columnFilters={columnFilters}
            onColumnFiltersUpdate={onColumnFiltersUpdate}
            onClear={() => onClearColumnFilter("room")}
          />
        )}
        {col === "status" && (
          <StatusColumnFilterBody
            columnFilters={columnFilters}
            onColumnFiltersUpdate={onColumnFiltersUpdate}
            onClear={() => onClearColumnFilter("status")}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function DateColumnFilterBody({
  columnFilters,
  onColumnFiltersUpdate,
  onClear,
}: {
  columnFilters: TableColumnFilterState;
  onColumnFiltersUpdate: SortFilterProps["onColumnFiltersUpdate"];
  onClear: () => void;
}) {
  const df = columnFilters.date;
  const from = df?.from ? parseISO(df.from) : undefined;
  const to = df?.to ? parseISO(df.to) : undefined;
  const has = columnFilterIsActive("date", columnFilters);
  const inlineValue = from || to ? { from, to } : undefined;

  return (
    <div className="space-y-3">
      <DateRangePickerInline
        date={inlineValue}
        label="Filter by booking date (range)"
        onDateChange={(range) =>
          onColumnFiltersUpdate((prev) => {
            if (!range?.from && !range?.to) {
              const { date: _, ...rest } = prev;
              return rest;
            }
            const nextFrom = range.from
              ? format(range.from, "yyyy-MM-dd")
              : undefined;
            const nextTo = range.to
              ? format(range.to, "yyyy-MM-dd")
              : undefined;
            if (!nextFrom?.trim() && !nextTo?.trim()) {
              const { date: _, ...rest } = prev;
              return rest;
            }
            return { ...prev, date: { from: nextFrom, to: nextTo } };
          })
        }
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!has}
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}

function TimeColumnFilterBody({
  columnFilters,
  onColumnFiltersUpdate,
  onClear,
}: {
  columnFilters: TableColumnFilterState;
  onColumnFiltersUpdate: SortFilterProps["onColumnFiltersUpdate"];
  onClear: () => void;
}) {
  const tf = columnFilters.time;
  const has = columnFilterIsActive("time", columnFilters);

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-medium">
        Start time from / end time by (24h slots)
      </p>
      <div className="space-y-1.5">
        <Label className="text-xs">Start from</Label>
        <Select
          value={tf?.startFrom ?? "__any__"}
          onValueChange={(v) =>
            onColumnFiltersUpdate((prev) => {
              const startFrom = v === "__any__" ? undefined : v;
              const endBy = prev.time?.endBy;
              if (!startFrom?.trim() && !endBy?.trim()) {
                const { time: _, ...rest } = prev;
                return rest;
              }
              return { ...prev, time: { startFrom, endBy } };
            })
          }
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="__any__">Any</SelectItem>
            {TIME_SLOT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">End by</Label>
        <Select
          value={tf?.endBy ?? "__any__"}
          onValueChange={(v) =>
            onColumnFiltersUpdate((prev) => {
              const endBy = v === "__any__" ? undefined : v;
              const startFrom = prev.time?.startFrom;
              if (!startFrom?.trim() && !endBy?.trim()) {
                const { time: _, ...rest } = prev;
                return rest;
              }
              return { ...prev, time: { startFrom, endBy } };
            })
          }
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="__any__">Any</SelectItem>
            {TIME_SLOT_OPTIONS.map((opt) => (
              <SelectItem key={`e-${opt.value}`} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!has}
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}

function GroupColumnFilterBody({
  columnFilters,
  onColumnFiltersUpdate,
  onClear,
}: {
  columnFilters: TableColumnFilterState;
  onColumnFiltersUpdate: SortFilterProps["onColumnFiltersUpdate"];
  onClear: () => void;
}) {
  const val = columnFilters.group ?? "";
  const has = Boolean(val.trim());

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Contains</Label>
        <Input
          placeholder="Group name…"
          value={val}
          onChange={(e) =>
            onColumnFiltersUpdate((prev) => {
              const q = e.target.value;
              if (!q.trim()) {
                const { group: _, ...rest } = prev;
                return rest;
              }
              return { ...prev, group: q };
            })
          }
          className="h-8"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!has}
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}

function RoomColumnFilterBody({
  columnFilters,
  onColumnFiltersUpdate,
  onClear,
}: {
  columnFilters: TableColumnFilterState;
  onColumnFiltersUpdate: SortFilterProps["onColumnFiltersUpdate"];
  onClear: () => void;
}) {
  const val = columnFilters.room ?? "";
  const has = Boolean(val.trim());

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Room</Label>
        <Select
          value={val || "__any__"}
          onValueChange={(v) =>
            onColumnFiltersUpdate((prev) => {
              if (v === "__any__") {
                const { room: _, ...rest } = prev;
                return rest;
              }
              return { ...prev, room: v };
            })
          }
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Any room" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">Any</SelectItem>
            {TABLE_ROOM_OPTIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!has}
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}

function StatusColumnFilterBody({
  columnFilters,
  onColumnFiltersUpdate,
  onClear,
}: {
  columnFilters: TableColumnFilterState;
  onColumnFiltersUpdate: SortFilterProps["onColumnFiltersUpdate"];
  onClear: () => void;
}) {
  const val = columnFilters.status ?? "";
  const has = Boolean(val.trim());

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select
          value={val || "__any__"}
          onValueChange={(v) =>
            onColumnFiltersUpdate((prev) => {
              if (v === "__any__") {
                const { status: _, ...rest } = prev;
                return rest;
              }
              return { ...prev, status: v };
            })
          }
        >
          <SelectTrigger className="h-8 w-full">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__any__">Any</SelectItem>
            {TABLE_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        disabled={!has}
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}

function ColumnHeader({
  col,
  label,
  sortFilter,
}: {
  col: ColumnKey;
  label: string;
  sortFilter: SortFilterProps;
}) {
  const {
    sortColumn,
    sortDirection,
    onSortClick,
    columnFilters,
    onColumnFiltersUpdate,
    onClearColumnFilter,
  } = sortFilter;

  return (
    <th className="px-4 py-3 text-left">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium uppercase tracking-wider transition-colors hover:bg-muted/80",
            sortColumn === col ? "text-primary" : "text-primary/90",
          )}
          onClick={() => onSortClick(col)}
        >
          {label}
          <SortChevron
            col={col}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />
        </button>
        <ColumnFilterControl
          col={col}
          columnFilters={columnFilters}
          onColumnFiltersUpdate={onColumnFiltersUpdate}
          onClearColumnFilter={onClearColumnFilter}
        />
      </div>
    </th>
  );
}

export function BookingsTable({
  displayedBookings,
  sortFilter,
  emptyState,
  ...shared
}: {
  displayedBookings: BookingDisplayModel[];
  sortFilter: SortFilterProps;
  /** Shown in the table body when there are no rows (headers stay visible). */
  emptyState?: ReactNode;
} & SharedProps) {
  const {
    formatDate,
    formatTime,
    getBookingStatus,
    getClassBadgeColor,
    onViewDetails,
    onEdit,
    onDelete,
  } = shared;

  return (
    <div className="scrollbar-brand overflow-x-auto rounded-md border border-border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="text-muted-foreground w-12 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider tabular-nums">
              #
            </th>
            <ColumnHeader col="date" label="Date" sortFilter={sortFilter} />
            <ColumnHeader col="time" label="Time" sortFilter={sortFilter} />
            <ColumnHeader col="group" label="Group" sortFilter={sortFilter} />
            <ColumnHeader col="room" label="Room" sortFilter={sortFilter} />
            <ColumnHeader
              col="status"
              label="Status"
              sortFilter={sortFilter}
            />
            <th className="text-primary px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {displayedBookings.length === 0 ? (
            <tr className="bg-card">
              <td className="px-4 py-12" colSpan={7}>
                {emptyState ?? (
                  <p className="text-center text-sm text-muted-foreground">
                    No rows to display.
                  </p>
                )}
              </td>
            </tr>
          ) : (
            displayedBookings.map((booking, index) => {
              const status = getBookingStatus(booking);
              return (
                <tr
                  key={booking.id}
                  className="hover:bg-muted/80 transition-colors duration-200"
                >
                  <td className="text-muted-foreground px-3 py-4 text-sm tabular-nums">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="text-primary/75 mr-2 h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">
                        {formatDate(booking.date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                    <div className="flex items-center">
                      <Clock className="text-primary/75 mr-2 h-4 w-4 shrink-0" />
                      <span className="text-sm">
                        {formatTime(booking.startTime)} –{" "}
                        {formatTime(booking.endTime)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="text-primary/75 mr-2 h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">
                        {booking.groupName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={getClassBadgeColor(booking.className)}
                    >
                      {booking.className}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary/75 hover:text-primary hover:bg-muted"
                        onClick={() => onViewDetails(booking)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary/75 hover:text-primary hover:bg-muted"
                        onClick={() => onEdit(booking)}
                        title="Edit Booking"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete Booking"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this booking? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDelete(booking.id)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
