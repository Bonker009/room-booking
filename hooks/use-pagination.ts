"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_PAGE_SIZE = 10;

interface UsePaginationOptions {
  /** When this value changes, the current page resets to 1. */
  resetKey?: string;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {},
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [options.resetKey]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalItems);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems,
    startIndex,
    endIndex,
    hasPagination: totalItems > pageSize,
  };
}
