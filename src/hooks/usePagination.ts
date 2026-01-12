import { useState, useMemo } from "react";

export interface UsePaginationOptions<T> {
  items: T[];
  itemsPerPage: number;
}

export interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  paginatedItems: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

export function usePagination<T>({
  items,
  itemsPerPage,
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [currentPageState, setCurrentPageState] = useState(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(items.length / itemsPerPage));
  }, [items.length, itemsPerPage]);

  const currentPage = useMemo(() => {
    if (currentPageState > totalPages && totalPages > 0) {
      return totalPages;
    }
    return currentPageState;
  }, [currentPageState, totalPages]);

  const paginatedItems = useMemo(() => {
    const validPage = Math.min(currentPage, totalPages);
    const startIndex = (validPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage, totalPages]);

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPageState(validPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPageState(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPageState(currentPage - 1);
    }
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    previousPage,
    canGoNext: currentPage < totalPages,
    canGoPrevious: currentPage > 1,
  };
}
