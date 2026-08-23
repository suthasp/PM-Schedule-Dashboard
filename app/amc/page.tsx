"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useFilterState } from "@/components/providers/FilterProvider";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useAmcData } from "@/hooks/useAmcData";
import { useFilteredData } from "@/hooks/useFilteredData";
import { LS_KEYS } from "@/lib/constants";
import type { ScheduleData } from "@/types/schedule";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const AGGridTable = dynamic(
  () => import("@/components/grid/AGGridTable").then((m) => m.AGGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

const FilterBar = dynamic(
  () => import("@/components/dashboard/FilterBar").then((m) => m.FilterBar),
  { ssr: false },
);

function AmcContent({ data }: { data: ScheduleData }): ReactNode {
  // Own sheet, own filter state — these dropdowns don't disturb the Dashboard.
  const controller = useFilterState();
  const { tasks } = useFilteredData(data, controller.filters);

  return (
    <div className="space-y-4">
      <FilterBar data={data} controller={controller} />
      <AGGridTable data={data} tasks={tasks} storageKeyBase={LS_KEYS.amcGridColumnState} />
    </div>
  );
}

export default function AmcPage(): ReactNode {
  const { query, refresh } = useAmcData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return <ErrorPage title="Could not load AMC data" message={query.error.message} onRetry={refresh} />;
  }
  return <AmcContent data={query.data} />;
}
