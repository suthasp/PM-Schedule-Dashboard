"use client";

import { Camera, Printer } from "lucide-react";
import { useCallback, useRef, type ReactNode } from "react";
import { CalendarHeatmap } from "@/components/dashboard/charts/CalendarHeatmap";
import { DistributionBarChart } from "@/components/dashboard/charts/DistributionBarChart";
import { MonthlyBarChart } from "@/components/dashboard/charts/MonthlyBarChart";
import { StatusPieChart } from "@/components/dashboard/charts/StatusPieChart";
import { TrendLineChart } from "@/components/dashboard/charts/TrendLineChart";
import { WeeklyBarChart } from "@/components/dashboard/charts/WeeklyBarChart";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiRow } from "@/components/dashboard/KpiRow";
import { PlanActualTable } from "@/components/dashboard/PlanActualTable";
import { SiteSummaryRow } from "@/components/dashboard/SiteSummaryRow";
import { useFilters } from "@/components/providers/FilterProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { ChartCard } from "@/components/ui/ChartCard";
import { useFilteredData } from "@/hooks/useFilteredData";
import type { ScheduleData } from "@/types/schedule";
import { downloadScreenshot, printDashboard } from "@/utils/export";

/** Executive dashboard: KPI row + seven interactive charts, all filter-linked. */
export function DashboardView({ data }: { data: ScheduleData }): ReactNode {
  const { jobs, kpis } = useFilteredData(data);
  const { filters, toggleFilter } = useFilters();
  const { settings } = useSettings();
  const captureRef = useRef<HTMLDivElement>(null);

  const screenshot = useCallback(() => {
    if (captureRef.current) {
      void downloadScreenshot(captureRef.current, settings.exportFilePrefix);
    }
  }, [settings.exportFilePrefix]);

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between gap-2">
        <p className="text-secondary text-sm">
          {jobs.length.toLocaleString()} scheduled PM jobs in view
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={printDashboard}
            className="flex h-9 items-center gap-1.5 rounded-xl border hairline px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Printer size={15} aria-hidden />
            Print / PDF
          </button>
          <button
            type="button"
            onClick={screenshot}
            className="flex h-9 items-center gap-1.5 rounded-xl border hairline px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Camera size={15} aria-hidden />
            Screenshot
          </button>
        </div>
      </div>

      <FilterBar data={data} />

      <div ref={captureRef} className="space-y-4">
        <KpiRow kpis={kpis} />

        <SiteSummaryRow data={data} />

        <ChartCard
          title="Plan vs Actual by Site"
          subtitle="Scheduled vs finished jobs per duty cycle — click a row to filter by site"
        >
          <PlanActualTable data={data} />
        </ChartCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <ChartCard title="PM Status" subtitle="Share of jobs by derived status">
            <StatusPieChart jobs={jobs} />
          </ChartCard>
          <ChartCard title="Monthly PM Jobs" subtitle="Stacked by status, fiscal-year order">
            <MonthlyBarChart jobs={jobs} data={data} />
          </ChartCard>
          <ChartCard title="Completion Trend" subtitle="Cumulative scheduled vs finished by week">
            <TrendLineChart jobs={jobs} data={data} />
          </ChartCard>
          <ChartCard title="Equipment Category" subtitle="Jobs per category — click to filter">
            <DistributionBarChart
              jobs={jobs}
              dimension={(j) => j.category}
              domain={data.categories}
              colorSlot={0}
              activeValue={filters.category}
              onSelect={(v) => toggleFilter("category", v)}
            />
          </ChartCard>
          <ChartCard title="Site / Data Hall" subtitle="Jobs per site — click to filter">
            <DistributionBarChart
              jobs={jobs}
              dimension={(j) => j.site}
              domain={data.sites}
              colorSlot={1}
              activeValue={filters.site}
              onSelect={(v) => toggleFilter("site", v)}
            />
          </ChartCard>
          <ChartCard title="Duty-Cycle Workload" subtitle="Jobs per maintenance cycle — click to filter">
            <DistributionBarChart
              jobs={jobs}
              dimension={(j) => j.dutyCycle}
              domain={data.dutyCycles}
              colorSlot={4}
              activeValue={filters.dutyCycle}
              onSelect={(v) => toggleFilter("dutyCycle", v)}
            />
          </ChartCard>
        </div>

        <ChartCard
          title={`Weekly PM Trend — ${data.weeks[0]?.label ?? ""}/${data.weeks[0]?.year ?? ""} – ${
            data.weeks[data.weeks.length - 1]?.label ?? ""
          }/${data.weeks[data.weeks.length - 1]?.year ?? ""}`}
          subtitle="Jobs per week, stacked by status — click a bar to filter by month"
        >
          <WeeklyBarChart jobs={jobs} data={data} />
        </ChartCard>

        <ChartCard
          title="Weekly Calendar Heatmap"
          subtitle="Scheduled jobs per week across the fiscal year"
        >
          <CalendarHeatmap jobs={jobs} data={data} />
        </ChartCard>
      </div>
    </div>
  );
}
