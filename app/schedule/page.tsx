"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useFilteredData } from "@/hooks/useFilteredData";
import { useScheduleData } from "@/hooks/useScheduleData";
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

function ScheduleContent({ data }: { data: ScheduleData }): ReactNode {
  const { tasks } = useFilteredData(data);
  return (
    <div className="space-y-4">
      <FilterBar data={data} />
      <AGGridTable data={data} tasks={tasks} />
    </div>
  );
}

export default function SchedulePage(): ReactNode {
  const { query, refresh } = useScheduleData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load schedule data" message={query.error.message} onRetry={refresh} />
    );
  }
  return <ScheduleContent data={query.data} />;
}
