"use client";

import { useCallback, useEffect, useState } from "react";

import type { DateRangeValue } from "@/components/date-range-picker";
import { filterBookingsList } from "@/lib/booking-filters";
import type { Booking } from "@/lib/booking-types";

export function useBookingFilters(bookings: Booking[]) {
  const [filter, setFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    DateRangeValue | undefined
  >(undefined);
  const [roomFilter, setRoomFilter] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);

  const applyFilters = useCallback(() => {
    setFilteredBookings(
      filterBookingsList({
        bookings,
        filter,
        dateRangeFilter,
        roomFilter,
        activeTab,
      }),
    );
  }, [bookings, filter, dateRangeFilter, roomFilter, activeTab]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearAllFilters = () => {
    setFilter("");
    setDateRangeFilter(undefined);
    setRoomFilter("");
    setActiveTab("all");
  };

  const hasToolbarFilters = Boolean(
    filter || dateRangeFilter?.from || dateRangeFilter?.to || roomFilter,
  );

  return {
    filter,
    setFilter,
    dateRangeFilter,
    setDateRangeFilter,
    roomFilter,
    setRoomFilter,
    activeTab,
    setActiveTab,
    filteredBookings,
    clearAllFilters,
    hasToolbarFilters,
  };
}
