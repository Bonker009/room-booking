"use client";

import { Download, Filter, Search, X } from "lucide-react";

import { DateRangePicker } from "@/components/date-range-picker";
import type { DateRangeValue } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ROOM_OPTIONS } from "@/lib/rooms";

interface BookingToolbarProps {
  filter: string;
  onFilterChange: (value: string) => void;
  dateRangeFilter: DateRangeValue | undefined;
  onDateRangeChange: (value: DateRangeValue | undefined) => void;
  roomFilter: string;
  onRoomFilterChange: (value: string) => void;
  onClearAll: () => void;
  showClearAll: boolean;
  onExportCsv?: () => void;
}

export function BookingToolbar({
  filter,
  onFilterChange,
  dateRangeFilter,
  onDateRangeChange,
  roomFilter,
  onRoomFilterChange,
  onClearAll,
  showClearAll,
  onExportCsv,
}: BookingToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 lg:flex-row">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="w-full border-primary/20 pl-10 focus-visible:ring-primary/35 sm:w-[250px]"
            value={filter}
            maxLength={20}
            onChange={(e) => onFilterChange(e.target.value)}
          />
          {filter && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1.5 h-7 w-7"
              onClick={() => onFilterChange("")}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <DateRangePicker
          date={dateRangeFilter}
          onDateChange={onDateRangeChange}
          placeholder="Pick a date"
          fieldClassName="w-full sm:w-auto"
          buttonClassName="w-full justify-start border-primary/20 hover:bg-muted lg:min-w-[220px] sm:w-[260px]"
        />
        <Select value={roomFilter} onValueChange={onRoomFilterChange}>
          <SelectTrigger className="w-full border-primary/20 focus:ring-primary/35 sm:w-[180px]">
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Filter by room" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {ROOM_OPTIONS.map((room) => (
              <SelectItem key={room} value={room}>
                {room}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onExportCsv ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-10 border-primary/20"
                onClick={onExportCsv}
              >
                <Download className="mr-1 h-4 w-4" />
                Export CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download filtered bookings as CSV</TooltipContent>
          </Tooltip>
        ) : null}
        {showClearAll && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-10 border-primary/20 bg-transparent px-3 text-sm hover:bg-muted"
                onClick={onClearAll}
              >
                <X className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all toolbar filters</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
