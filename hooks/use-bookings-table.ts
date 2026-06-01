"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

import type { DateRangeValue } from "@/components/date-range-picker";
import type { Booking } from "@/lib/booking-types";
import { buildBookingsQueryString } from "@/lib/booking-query";
import type { ColumnKey, TableColumnFilterState } from "@/lib/booking-display";

const DEFAULT_PAGE_SIZE = 10;

export interface BookingsTableResponse {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function columnFiltersToQuery(
  filters: TableColumnFilterState,
): Record<string, string | undefined> {
  return {
    dateFrom: filters.date?.from?.trim() || undefined,
    dateTo: filters.date?.to?.trim() || undefined,
    startTimeFrom: filters.time?.startFrom?.trim() || undefined,
    endTimeBy: filters.time?.endBy?.trim() || undefined,
    groupFilter: filters.group?.trim() || undefined,
    roomExact: filters.room?.trim() || undefined,
    statusLabel: filters.status?.trim() || undefined,
  };
}

function mapSortColumn(col: ColumnKey | null): string | undefined {
  if (!col) return undefined;
  return col;
}

export function useBookingsTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<
    DateRangeValue | undefined
  >(undefined);
  const [roomFilter, setRoomFilter] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [columnFilters, setColumnFilters] = useState<TableColumnFilterState>(
    {},
  );
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [rows, setRows] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryParams = useMemo(() => {
    const hasToolbarDateRange = Boolean(
      dateRangeFilter?.from || dateRangeFilter?.to,
    );
    const params: Record<string, string | number | undefined> = {
      page,
      limit: pageSize,
      search: debouncedSearch || undefined,
      roomExact: roomFilter || undefined,
      sortBy: mapSortColumn(sortColumn),
      sortOrder: sortColumn ? sortDirection : undefined,
      ...columnFiltersToQuery(columnFilters),
    };

    if (hasToolbarDateRange) {
      if (dateRangeFilter?.from) {
        params.startDate = format(dateRangeFilter.from, "yyyy-MM-dd");
      }
      if (dateRangeFilter?.to) {
        params.endDate = format(dateRangeFilter.to, "yyyy-MM-dd");
      }
    } else {
      params.tab = activeTab;
    }

    return params;
  }, [
    page,
    pageSize,
    debouncedSearch,
    roomFilter,
    dateRangeFilter,
    activeTab,
    columnFilters,
    sortColumn,
    sortDirection,
  ]);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = buildBookingsQueryString(queryParams);
      const res = await fetch(`/api/bookings?${qs}`);
      if (!res.ok) {
        toast.error("Error fetching bookings");
        return;
      }
      const data: BookingsTableResponse = await res.json();
      setRows(data.bookings ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    roomFilter,
    dateRangeFilter,
    activeTab,
    columnFilters,
    sortColumn,
    sortDirection,
    pageSize,
  ]);

  const hasToolbarFilters = Boolean(
    search || dateRangeFilter?.from || dateRangeFilter?.to || roomFilter,
  );

  const clearAllFilters = () => {
    setSearch("");
    setDateRangeFilter(undefined);
    setRoomFilter("");
    setActiveTab("all");
    setColumnFilters({});
    setSortColumn(null);
    setSortDirection("asc");
    setPage(1);
  };

  const clearColumnFilters = () => setColumnFilters({});

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

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);
  const rowOffset = startIndex > 0 ? startIndex - 1 : 0;

  return {
    rows,
    total,
    totalPages,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    startIndex,
    endIndex,
    rowOffset,
    search,
    setSearch,
    dateRangeFilter,
    setDateRangeFilter,
    roomFilter,
    setRoomFilter,
    activeTab,
    setActiveTab,
    columnFilters,
    sortColumn,
    sortDirection,
    hasToolbarFilters,
    clearAllFilters,
    clearColumnFilters,
    handleSortClick,
    onColumnFiltersUpdate,
    onClearColumnFilter,
    refetch: fetchRows,
  };
}
