"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_FILTERS, type Filters } from "@/types/schedule";

interface FilterContextValue {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  /** Set a filter, or clear it back to "all" when the same value is clicked again. */
  toggleFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  clearFilters: () => void;
  activeCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

/**
 * Global filter state shared by the Dashboard and the PM Schedule grid, so a
 * click on any chart, KPI card or data-hall bar filters both views.
 */
export function FilterProvider({ children }: { children: ReactNode }): ReactNode {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleFilter = useCallback(<K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? (DEFAULT_FILTERS[key] as Filters[K]) : value,
    }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeCount = useMemo(
    () =>
      (Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]).filter(
        (k) => filters[k] !== DEFAULT_FILTERS[k],
      ).length,
    [filters],
  );

  const value = useMemo(
    () => ({ filters, setFilter, toggleFilter, clearFilters, activeCount }),
    [filters, setFilter, toggleFilter, clearFilters, activeCount],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}
