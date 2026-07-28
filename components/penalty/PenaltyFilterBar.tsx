"use client";

import { FilterX } from "lucide-react";
import type { ReactNode } from "react";
import { DateRangeFilter, type DateRange } from "@/components/penalty/DateRangeFilter";

export interface PenaltyFilters {
  site: string;
  activitySla: string;
  dateFrom: string;
  dateTo: string;
}

export const DEFAULT_PENALTY_FILTERS: PenaltyFilters = {
  site: "all",
  activitySla: "all",
  dateFrom: "",
  dateTo: "",
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}): ReactNode {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs">
      <span className="text-muted font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-xl border hairline bg-transparent px-2.5 text-sm outline-none transition-colors focus:border-accent dark:focus:border-accent-dark"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

interface PenaltyFilterBarProps {
  siteOptions: string[];
  activitySlaOptions: string[];
  /** Earliest / latest date (yyyy-mm-dd) present in the unfiltered data. */
  minDate: string;
  maxDate: string;
  filters: PenaltyFilters;
  onChange: (filters: PenaltyFilters) => void;
}

/** Dimension filters for the Tickets Penalty page; drives both the summary and the grid. */
export function PenaltyFilterBar({
  siteOptions,
  activitySlaOptions,
  minDate,
  maxDate,
  filters,
  onChange,
}: PenaltyFilterBarProps): ReactNode {
  const activeCount = [
    filters.site !== "all",
    filters.activitySla !== "all",
    filters.dateFrom !== "" || filters.dateTo !== "",
  ].filter(Boolean).length;

  return (
    <div className="card no-print grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
      <FilterSelect
        label="Site"
        value={filters.site}
        options={siteOptions}
        onChange={(site) => onChange({ ...filters, site })}
      />
      <FilterSelect
        label="Activity SLA"
        value={filters.activitySla}
        options={activitySlaOptions}
        onChange={(activitySla) => onChange({ ...filters, activitySla })}
      />
      {minDate && maxDate && (
        <div className="sm:col-span-2">
          <DateRangeFilter
            minDate={minDate}
            maxDate={maxDate}
            value={{ from: filters.dateFrom, to: filters.dateTo } satisfies DateRange}
            onChange={(range) => onChange({ ...filters, dateFrom: range.from, dateTo: range.to })}
          />
        </div>
      )}
      <div className="flex flex-col gap-1 text-xs">
        {/* Invisible label spacer so the button lines up with the Site/Activity SLA
            selects, not the bottom of the taller Date Range cell (which also has a slider row). */}
        <span className="invisible font-medium">Clear</span>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PENALTY_FILTERS)}
          disabled={activeCount === 0}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border hairline text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
        >
          <FilterX size={15} aria-hidden />
          Clear{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>
    </div>
  );
}
