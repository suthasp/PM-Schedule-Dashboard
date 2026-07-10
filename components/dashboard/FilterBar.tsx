"use client";

import { FilterX } from "lucide-react";
import type { ReactNode } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import { JOB_STATUSES, type Filters, type JobStatus, type ScheduleData } from "@/types/schedule";

interface SelectProps<T extends string | number> {
  label: string;
  value: T | "all";
  options: readonly T[];
  onChange: (value: T | "all") => void;
}

function FilterSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: SelectProps<T>): ReactNode {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs">
      <span className="text-muted font-medium">{label}</span>
      <select
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "all") onChange("all");
          else {
            const match = options.find((o) => String(o) === raw);
            if (match !== undefined) onChange(match);
          }
        }}
        className="h-9 rounded-xl border hairline bg-transparent px-2.5 text-sm outline-none transition-colors focus:border-accent dark:focus:border-accent-dark"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <option value="all">All</option>
        {options.map((o) => (
          <option key={String(o)} value={String(o)}>
            {String(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One row of dimension filters; every change re-renders all charts and the grid. */
export function FilterBar({ data }: { data: ScheduleData }): ReactNode {
  const { filters, setFilter, clearFilters, activeCount } = useFilters();

  const set = <K extends keyof Filters>(key: K) => (value: Filters[K]) => setFilter(key, value);

  // Weeks narrow to the chosen month; changing month drops a stale week pick.
  const weekOptions = data.weeks
    .filter((w) => filters.month === "all" || w.month === filters.month)
    .map((w) => w.label);

  return (
    <div className="card no-print grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-8">
      <FilterSelect<number> label="Year" value={filters.year} options={data.years} onChange={set("year")} />
      <FilterSelect<string>
        label="Month"
        value={filters.month}
        options={data.months}
        onChange={(v) => {
          setFilter("month", v);
          setFilter("week", "all");
        }}
      />
      <FilterSelect<string> label="Week" value={filters.week} options={weekOptions} onChange={set("week")} />
      <FilterSelect<string> label="Site / Data Hall" value={filters.site} options={data.sites} onChange={set("site")} />
      <FilterSelect<JobStatus>
        label="Status"
        value={filters.status}
        options={JOB_STATUSES}
        onChange={set("status")}
      />
      <FilterSelect<string>
        label="Category"
        value={filters.category}
        options={data.categories}
        onChange={set("category")}
      />
      <FilterSelect<string>
        label="Duty Cycle"
        value={filters.dutyCycle}
        options={data.dutyCycles}
        onChange={set("dutyCycle")}
      />
      <div className="flex items-end">
        <button
          type="button"
          onClick={clearFilters}
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
