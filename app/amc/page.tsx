"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useFilterState } from "@/components/providers/FilterProvider";
import { ChartCard } from "@/components/ui/ChartCard";
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

const KpiRow = dynamic(() => import("@/components/dashboard/KpiRow").then((m) => m.KpiRow), {
  ssr: false,
});

const AmcSiteSummary = dynamic(
  () => import("@/components/amc/AmcSummaryTables").then((m) => m.AmcSiteSummary),
  { ssr: false },
);

const AmcSystemSummary = dynamic(
  () => import("@/components/amc/AmcSummaryTables").then((m) => m.AmcSystemSummary),
  { ssr: false },
);

const AmcDutyCyclePivot = dynamic(
  () => import("@/components/amc/AmcDutyCyclePivot").then((m) => m.AmcDutyCyclePivot),
  { ssr: false },
);

const AmcSiteCombo = dynamic(
  () => import("@/components/amc/AmcSiteCombo").then((m) => m.AmcSiteCombo),
  { ssr: false },
);

function AmcContent({ data }: { data: ScheduleData }): ReactNode {
  // Own sheet, own filter state — these dropdowns don't disturb the Dashboard.
  const controller = useFilterState();
  const { jobs, tasks, kpis } = useFilteredData(data, controller.filters);

  return (
    <div className="space-y-4">
      <FilterBar data={data} controller={controller} />
      <KpiRow kpis={kpis} controller={controller} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Site Summary" subtitle="PM plan vs actual by site">
          <AmcSiteSummary data={data} jobs={jobs} />
        </ChartCard>
        <ChartCard title="PM Completion by Site" subtitle="Plan vs actual per site with completion rate">
          <div className="overflow-x-auto">
            <AmcSiteCombo data={data} jobs={jobs} />
          </div>
        </ChartCard>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Maintenance Cycle Breakdown"
          subtitle="Plan / Actual / Remain by duty cycle and task — Y yearly · H half-yearly · Q quarterly · 2M every 2 months · M monthly"
        >
          <AmcDutyCyclePivot data={data} tasks={tasks} jobs={jobs} />
        </ChartCard>
        <ChartCard title="Equipment System Summary" subtitle="PM plan vs actual by equipment system">
          <AmcSystemSummary data={data} jobs={jobs} />
        </ChartCard>
      </div>
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
