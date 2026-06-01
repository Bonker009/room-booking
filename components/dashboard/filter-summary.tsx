"use client";

import { format } from "date-fns";

import type { DateRangeValue } from "@/components/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FilterSummaryProps {
  displayedCount: number;
  filteredCount: number;
  totalCount: number;
  filter: string;
  dateRangeFilter?: DateRangeValue;
  roomFilter: string;
  hasToolbarFilters: boolean;
  hasActiveColumnFilters: boolean;
  onClearColumnFilters: () => void;
}

export function FilterSummary({
  displayedCount,
  filteredCount,
  totalCount,
  filter,
  dateRangeFilter,
  roomFilter,
  hasToolbarFilters,
  hasActiveColumnFilters,
  onClearColumnFilters,
}: FilterSummaryProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {displayedCount} of {filteredCount} in view
        {filteredCount !== totalCount && <> ({totalCount} total in system)</>}
        {hasToolbarFilters && (
          <span className="ml-1 font-medium text-primary">(filtered)</span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {hasActiveColumnFilters && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={onClearColumnFilters}
          >
            Clear column filters
          </Button>
        )}
        {hasToolbarFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {filter && (
              <Badge variant="secondary" className="bg-primary/12 text-primary">
                Search: {`"${filter}"`}
              </Badge>
            )}
            {(dateRangeFilter?.from || dateRangeFilter?.to) && (
              <Badge variant="secondary" className="bg-primary/12 text-primary">
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
              <Badge variant="secondary" className="bg-primary/12 text-primary">
                Room: {roomFilter}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
