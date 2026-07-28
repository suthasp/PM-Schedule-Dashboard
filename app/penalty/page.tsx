"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_PENALTY_FILTERS,
  PenaltyFilterBar,
  type PenaltyFilters,
} from "@/components/penalty/PenaltyFilterBar";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { usePenaltyData } from "@/hooks/usePenaltyData";
import { LS_KEYS } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { resolvePenaltyFields, shortSite } from "@/utils/penaltyFields";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

const PenaltySummary = dynamic(
  () => import("@/components/penalty/PenaltySummary").then((m) => m.PenaltySummary),
  { ssr: false },
);

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter((v) => v !== ""))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** "2026-05-02 0:41:30" → "2026-05-02"; empty/unparseable input → "". */
function datePart(raw: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(raw.trim());
  return m?.[1] ?? "";
}

/** Earliest/latest date (yyyy-mm-dd) among the given raw CREATIONDATE values. */
function dateBounds(values: string[]): { min: string; max: string } {
  let min = "";
  let max = "";
  for (const v of values) {
    const d = datePart(v);
    if (!d) continue;
    if (!min || d < min) min = d;
    if (!max || d > max) max = d;
  }
  return { min, max };
}

function PenaltyContent({ data }: { data: ProblemData }): ReactNode {
  const [filters, setFilters] = useState<PenaltyFilters>(DEFAULT_PENALTY_FILTERS);
  const fields = useMemo(() => resolvePenaltyFields(data), [data]);

  const options = useMemo(
    () => ({
      sites: fields.ownerGroup
        ? uniqueSorted(data.rows.map((r) => shortSite(r.values[fields.ownerGroup ?? ""] ?? "")))
        : [],
      activitySla: fields.activitySla
        ? uniqueSorted(data.rows.map((r) => r.values[fields.activitySla ?? ""] ?? ""))
        : [],
      dates: fields.creationDate
        ? dateBounds(data.rows.map((r) => r.values[fields.creationDate ?? ""] ?? ""))
        : { min: "", max: "" },
    }),
    [data.rows, fields],
  );

  const filtered = useMemo<ProblemData>(() => {
    const matches = (values: Record<string, string>): boolean => {
      const siteOk =
        filters.site === "all" ||
        (fields.ownerGroup !== null && shortSite(values[fields.ownerGroup] ?? "") === filters.site);
      const slaOk =
        filters.activitySla === "all" ||
        (fields.activitySla !== null && (values[fields.activitySla] ?? "").trim() === filters.activitySla);
      const rowDate = fields.creationDate ? datePart(values[fields.creationDate] ?? "") : "";
      const fromOk = filters.dateFrom === "" || (rowDate !== "" && rowDate >= filters.dateFrom);
      const toOk = filters.dateTo === "" || (rowDate !== "" && rowDate <= filters.dateTo);
      return siteOk && slaOk && fromOk && toOk;
    };
    return { ...data, rows: data.rows.filter((r) => matches(r.values)) };
  }, [data, fields, filters]);

  return (
    <div className="space-y-4">
      <PenaltyFilterBar
        siteOptions={options.sites}
        activitySlaOptions={options.activitySla}
        minDate={options.dates.min}
        maxDate={options.dates.max}
        filters={filters}
        onChange={setFilters}
      />
      <PenaltySummary data={filtered} />
      <ProblemGridTable
        data={filtered}
        storageKeyBase={LS_KEYS.penaltyGridColumnState}
        itemLabel="tickets"
        autoSizeOnLoad
      />
    </div>
  );
}

export default function PenaltyPage(): ReactNode {
  const { query, refresh } = usePenaltyData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load penalty data" message={query.error.message} onRetry={refresh} />
    );
  }
  return <PenaltyContent data={query.data} />;
}
