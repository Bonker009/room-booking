"use client";

import { Filter, ListFilter, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface TableEmptyStateProps {
  variant: "no-rows" | "no-bookings";
  hasToolbarFilters: boolean;
  onClearColumnFilters: () => void;
  onClearAllFilters: () => void;
  onCreateBooking: () => void;
}

export function TableEmptyState({
  variant,
  hasToolbarFilters,
  onClearColumnFilters,
  onClearAllFilters,
  onCreateBooking,
}: TableEmptyStateProps) {
  if (variant === "no-rows") {
    return (
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
          onClick={onClearColumnFilters}
        >
          Clear column filters
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Filter className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
      <h3 className="text-lg font-medium text-primary">No bookings found</h3>
      <p className="mt-1 text-muted-foreground">
        {hasToolbarFilters
          ? "No bookings match your current filters. Try adjusting your search criteria."
          : "Create your first booking to get started"}
      </p>
      {hasToolbarFilters ? (
        <Button
          variant="outline"
          className="mt-4 border-primary/20 bg-transparent text-primary hover:bg-muted"
          onClick={onClearAllFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      ) : (
        <Button
          className="mt-4 bg-gradient-to-r from-primary to-[#003d6b] text-primary-foreground hover:opacity-95"
          onClick={onCreateBooking}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      )}
    </div>
  );
}
