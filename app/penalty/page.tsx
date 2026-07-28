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
      return siteOk && slaOk;
    };
    return { ...data, rows: data.rows.filter((r) => matches(r.values)) };
  }, [data, fields, filters]);

  return (
    <div className="space-y-4">
      <PenaltyFilterBar
        siteOptions={options.sites}
        activitySlaOptions={options.activitySla}
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
