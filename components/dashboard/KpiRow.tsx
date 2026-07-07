"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, Clock, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { STATUS_COLORS } from "@/lib/constants";
import type { JobStatus, KpiSummary } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";

/** Five KPI tiles; the three status tiles toggle the global status filter. */
export function KpiRow({ kpis }: { kpis: KpiSummary }): ReactNode {
  const { filters, toggleFilter } = useFilters();

  const statusTile = (
    label: string,
    value: number,
    status: JobStatus,
    icon: typeof CheckCircle2,
  ): ReactNode => (
    <DashboardCard
      label={label}
      value={formatNumber(value)}
      icon={icon}
      color={STATUS_COLORS[status].light}
      active={filters.status === status}
      onClick={() => toggleFilter("status", status)}
    />
  );

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <DashboardCard
        label="Total PM Jobs"
        value={formatNumber(kpis.total)}
        icon={ClipboardList}
        color="var(--accent)"
        active={filters.status === "all"}
        onClick={() => toggleFilter("status", "all")}
      />
      {statusTile("Finished", kpis.finished, "Finished", CheckCircle2)}
      {statusTile("Remaining", kpis.remaining, "Remaining", Clock)}
      {statusTile("Overdue", kpis.overdue, "Overdue", AlertTriangle)}
      <DashboardCard
        label="Completion Rate"
        value={formatPercent(kpis.completionRate)}
        icon={TrendingUp}
        color="#0ca30c"
        sub={`${formatNumber(kpis.finished)} of ${formatNumber(kpis.total)}`}
      />
    </div>
  );
}
