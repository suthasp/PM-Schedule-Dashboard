"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { useFilters } from "@/components/providers/FilterProvider";
import { useChartTheme } from "@/hooks/useChartTheme";
import { JOB_STATUSES, type ScheduleData, type PMJob, type WeekInfo } from "@/types/schedule";

interface WeekDatum {
  label: string;
  month: string;
  Finished: number;
  Remaining: number;
  Overdue: number;
  [key: string]: string | number;
}

/** Short axis label like "W27/26". */
export function weekAxisLabel(week: WeekInfo): string {
  return `W${week.weekNumber}/${String(week.year).slice(2)}`;
}

/** One stacked bar per fiscal week. Clicking a bar filters by that week's month. */
export function WeeklyBarChart({
  jobs,
  data,
}: {
  jobs: PMJob[];
  data: ScheduleData;
}): ReactNode {
  const theme = useChartTheme();
  const { filters, toggleFilter } = useFilters();

  const rows = useMemo<WeekDatum[]>(() => {
    const byIndex = new Map<number, WeekDatum>();
    for (const w of data.weeks) {
      byIndex.set(w.index, {
        label: weekAxisLabel(w),
        month: w.month,
        Finished: 0,
        Remaining: 0,
        Overdue: 0,
      });
    }
    for (const j of jobs) {
      const row = byIndex.get(j.week.index);
      if (row) row[j.status] = Number(row[j.status]) + 1;
    }
    return data.weeks
      .map((w) => byIndex.get(w.index))
      .filter((r): r is WeekDatum => r !== undefined);
  }, [jobs, data.weeks]);

  const pickWeek = (_: unknown, index: number): void => {
    const row = rows[index];
    if (row) toggleFilter("month", row.month);
  };

  return (
    <div className="flex h-72 flex-col">
      <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {JOB_STATUSES.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: theme.statusColor(status) }}
              aria-hidden
            />
            <span className="text-secondary">{status}</span>
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke={theme.ink.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: theme.ink.grid }}
            interval={0}
            angle={-90}
            textAnchor="end"
            height={52}
            tick={{ fontSize: 9, fill: theme.ink.muted }}
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: theme.dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.04)" }}
            content={({ active, payload, label }) =>
              active && payload && payload.length > 0 ? (
                <ChartTooltip
                  label={String(label)}
                  rows={payload
                    .filter((p) => Number(p.value) > 0)
                    .map((p) => ({
                      name: String(p.name),
                      value: Number(p.value),
                      color: String(p.color),
                    }))}
                />
              ) : null
            }
          />
          {JOB_STATUSES.map((status, i) => (
            <Bar
              key={status}
              dataKey={status}
              stackId="jobs"
              fill={theme.statusColor(status)}
              radius={i === JOB_STATUSES.length - 1 ? [2, 2, 0, 0] : 0}
              onClick={pickWeek}
              className="cursor-pointer"
              opacity={filters.status === "all" || filters.status === status ? 1 : 0.35}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
