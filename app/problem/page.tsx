"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_PROBLEM_FILTERS,
  ProblemFilterBar,
  type ProblemFilters,
} from "@/components/problem/ProblemFilterBar";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useProblemData } from "@/hooks/useProblemData";
import type { ProblemData } from "@/types/problem";
import { resolveProblemFields } from "@/utils/problemTransform";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

const ProblemSummary = dynamic(
  () => import("@/components/problem/ProblemSummary").then((m) => m.ProblemSummary),
  { ssr: false },
);

const ProblemSiteCards = dynamic(
  () => import("@/components/problem/ProblemSiteCards").then((m) => m.ProblemSiteCards),
  { ssr: false },
);

function uniqueSorted(values: (string | undefined)[]): string[] {
  return [...new Set(values.map((v) => (v ?? "").trim()).filter((v) => v !== ""))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function ProblemContent({ data }: { data: ProblemData }): ReactNode {
  const [filters, setFilters] = useState<ProblemFilters>(DEFAULT_PROBLEM_FILTERS);
  const fields = useMemo(() => resolveProblemFields(data), [data]);

  const options = useMemo(
    () => ({
      sites: fields.site ? uniqueSorted(data.rows.map((r) => r.values[fields.site ?? ""])) : [],
      scopes: fields.scope ? uniqueSorted(data.rows.map((r) => r.values[fields.scope ?? ""])) : [],
      statuses: fields.workStatus
        ? uniqueSorted(data.rows.map((r) => r.values[fields.workStatus ?? ""]))
        : [],
    }),
    [data.rows, fields],
  );

  const filtered = useMemo<ProblemData>(() => {
    const matches = (values: Record<string, string>): boolean => {
      const has = (field: string | null, wanted: string): boolean =>
        wanted === "all" || (field !== null && (values[field] ?? "").trim() === wanted);
      return (
        has(fields.site, filters.site) &&
        has(fields.scope, filters.scope) &&
        has(fields.workStatus, filters.status)
      );
    };
    return { ...data, rows: data.rows.filter((r) => matches(r.values)) };
  }, [data, fields, filters]);

  return (
    <div className="space-y-4">
      <ProblemFilterBar
        siteOptions={options.sites}
        scopeOptions={options.scopes}
        statusOptions={options.statuses}
        filters={filters}
        onChange={setFilters}
      />
      <ProblemSummary data={filtered}>
        <ProblemSiteCards
          data={data}
          filters={filters}
          onToggleSite={(site) =>
            setFilters({ ...filters, site: filters.site === site ? "all" : site })
          }
        />
      </ProblemSummary>
      <ProblemGridTable data={filtered} />
    </div>
  );
}

export default function ProblemPage(): ReactNode {
  const { query, refresh } = useProblemData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load problem data" message={query.error.message} onRetry={refresh} />
    );
  }
  return <ProblemContent data={query.data} />;
}
