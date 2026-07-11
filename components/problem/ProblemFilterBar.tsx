"use client";

import { FilterX } from "lucide-react";
import type { ReactNode } from "react";

export interface ProblemFilters {
  site: string;
  scope: string;
  status: string;
}

export const DEFAULT_PROBLEM_FILTERS: ProblemFilters = { site: "all", scope: "all", status: "all" };

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

interface ProblemFilterBarProps {
  siteOptions: string[];
  scopeOptions: string[];
  statusOptions: string[];
  filters: ProblemFilters;
  onChange: (filters: ProblemFilters) => void;
}

/** Dimension filters for the Problem page; drives both the summary and the grid. */
export function ProblemFilterBar({
  siteOptions,
  scopeOptions,
  statusOptions,
  filters,
  onChange,
}: ProblemFilterBarProps): ReactNode {
  const activeCount = [filters.site, filters.scope, filters.status].filter((v) => v !== "all").length;

  return (
    <div className="card no-print grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
      <FilterSelect
        label="Site"
        value={filters.site}
        options={siteOptions}
        onChange={(site) => onChange({ ...filters, site })}
      />
      <FilterSelect
        label="In/Out Scope"
        value={filters.scope}
        options={scopeOptions}
        onChange={(scope) => onChange({ ...filters, scope })}
      />
      <FilterSelect
        label="Status"
        value={filters.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...filters, status })}
      />
      <div className="flex items-end">
        <button
          type="button"
          onClick={() => onChange(DEFAULT_PROBLEM_FILTERS)}
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
