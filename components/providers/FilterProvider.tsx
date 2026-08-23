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

export interface FilterContextValue {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  /** Set a filter, or clear it back to "all" when the same value is clicked again. */
  toggleFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  /** Add/remove a single site from the multi-select site filter. */
  toggleSite: (site: string) => void;
  clearFilters: () => void;
  activeCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

/**
 * One self-contained instance of the filter state. Backs the global provider,
 * and can also be held by a page that wants the same controls over its own
 * dataset without touching the shared Dashboard / PM Schedule filters.
 */
export function useFilterState(): FilterContextValue {
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

  const toggleSite = useCallback((site: string) => {
    setFilters((prev) => ({
      ...prev,
      site: prev.site.includes(site) ? prev.site.filter((s) => s !== site) : [...prev.site, site],
    }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const activeCount = useMemo(() => {
    let count = filters.site.length > 0 ? 1 : 0;
    for (const k of Object.keys(DEFAULT_FILTERS) as (keyof Filters)[]) {
      if (k !== "site" && filters[k] !== DEFAULT_FILTERS[k]) count++;
    }
    return count;
  }, [filters]);

  return useMemo(
    () => ({ filters, setFilter, toggleFilter, toggleSite, clearFilters, activeCount }),
    [filters, setFilter, toggleFilter, toggleSite, clearFilters, activeCount],
  );
}

/**
 * Global filter state shared by the Dashboard and the PM Schedule grid, so a
 * click on any chart, KPI card or data-hall bar filters both views.
 */
export function FilterProvider({ children }: { children: ReactNode }): ReactNode {
  const value = useFilterState();
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}
