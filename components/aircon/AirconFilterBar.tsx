"use client";

import { FilterX } from "lucide-react";
import type { ReactNode } from "react";
import {
  EMPTY_AIRCON_FILTERS,
  facetOptions,
  type AirconField,
  type AirconFilters,
} from "@/components/aircon/airconFilters";
import type { ProblemData } from "@/types/problem";

interface AirconFilterBarProps {
  /** The unfiltered sheet, so each dropdown can list what is reachable. */
  data: ProblemData;
  fields: AirconField[];
  filters: AirconFilters;
  onChange: (next: AirconFilters) => void;
}

/** Year / Month / air type / PM round / contractor / region / site dropdowns. */
export function AirconFilterBar({
  data,
  fields,
  filters,
  onChange,
}: AirconFilterBarProps): ReactNode {
  const anyActive = fields.some((f) => filters[f.key] !== "");

  return (
    <div className="card no-print p-3">
      <div className="flex flex-wrap items-end gap-3">
        {fields.map((field) => {
          const options = facetOptions(data, fields, filters, field);
          return (
            <label key={field.key} className="flex min-w-[130px] flex-1 flex-col gap-1">
              <span className="text-muted text-xs font-medium">{field.label}</span>
              <select
                value={filters[field.key]}
                onChange={(e) => onChange({ ...filters, [field.key]: e.target.value })}
                className="h-9 rounded-xl border hairline px-2 text-sm outline-none transition-colors focus:border-accent dark:focus:border-accent-dark"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <option value="">All</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
        <button
          type="button"
          onClick={() => onChange(EMPTY_AIRCON_FILTERS)}
          disabled={!anyActive}
          className="text-secondary flex h-9 items-center gap-1.5 rounded-xl border hairline px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
        >
          <FilterX size={15} aria-hidden />
          Clear
        </button>
      </div>
    </div>
  );
}
