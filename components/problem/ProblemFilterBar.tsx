"use client";

import { ChevronDown, FilterX } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface ProblemFilters {
  /** Empty array = "All" (no site filter); otherwise the selected sites. */
  site: string[];
  scope: string;
  status: string;
}

export const DEFAULT_PROBLEM_FILTERS: ProblemFilters = { site: [], scope: "all", status: "all" };

function MultiSiteSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const toggle = (site: string): void => {
    onChange(selected.includes(site) ? selected.filter((s) => s !== site) : [...selected, site]);
  };

  const summary =
    selected.length === 0 ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={rootRef} className="relative flex min-w-0 flex-col gap-1 text-xs">
      <span className="text-muted font-medium">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-9 items-center justify-between gap-1 rounded-xl border hairline bg-transparent px-2.5 text-left text-sm outline-none transition-colors focus:border-accent dark:focus:border-accent-dark"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown size={14} className="text-muted shrink-0" aria-hidden />
      </button>
      {open && (
        <div className="card absolute left-0 top-full z-20 mt-1 max-h-64 w-56 overflow-y-auto p-1.5 shadow-soft-lg">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
            <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
            All
          </label>
          <div className="my-1 border-t hairline" />
          {options.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} />
              <span className="truncate">{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const activeCount = [filters.site.length > 0, filters.scope !== "all", filters.status !== "all"].filter(
    Boolean,
  ).length;

  return (
    <div className="card no-print grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
      <MultiSiteSelect
        label="Site"
        selected={filters.site}
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
