"use client";

import { AlertTriangle, CheckCircle2, ClipboardList, Clock, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useFilters, type FilterContextValue } from "@/components/providers/FilterProvider";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { STATUS_COLORS } from "@/lib/constants";
import type { JobStatus, KpiSummary } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";

interface KpiRowProps {
  kpis: KpiSummary;
  /** Page-local filter state; defaults to the shared global filters. */
  controller?: FilterContextValue;
}

/** Five KPI tiles; the three status tiles toggle the status filter. */
export function KpiRow({ kpis, controller }: KpiRowProps): ReactNode {
  const global = useFilters();
  const { filters, toggleFilter } = controller ?? global;

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
        value={formatPercent(kpis.completionRate, 2)}
        icon={TrendingUp}
        color="#0ca30c"
        sub={`${formatNumber(kpis.finished)} of ${formatNumber(kpis.total)}`}
      />
    </div>
  );
}
