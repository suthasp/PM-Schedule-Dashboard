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
import { JOB_STATUSES, type PMJob, type ScheduleData } from "@/types/schedule";

interface MonthDatum {
  month: string;
  Completed: number;
  "In Progress": number;
  Remaining: number;
  Overdue: number;
  [key: string]: string | number;
}

/** Jobs per month, stacked by status. Clicking a month toggles the month filter. */
export function MonthlyBarChart({
  jobs,
  data,
}: {
  jobs: PMJob[];
  data: ScheduleData;
}): ReactNode {
  const theme = useChartTheme();
  const { filters, toggleFilter } = useFilters();

  const rows = useMemo<MonthDatum[]>(
    () =>
      data.months.map((month) => {
        const row: MonthDatum = {
          month,
          Completed: 0,
          "In Progress": 0,
          Remaining: 0,
          Overdue: 0,
        };
        for (const j of jobs) {
          if (j.week.month === month) row[j.status] = Number(row[j.status]) + 1;
        }
        return row;
      }),
    [jobs, data.months],
  );

  const pickMonth = (_: unknown, index: number): void => {
    const row = rows[index];
    if (row) toggleFilter("month", row.month);
  };

  return (
    <div className="flex h-64 flex-col">
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
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.ink.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => m.slice(0, 3)}
            tickLine={false}
            axisLine={{ stroke: theme.ink.grid }}
            interval={0}
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
              stroke={theme.surface}
              strokeWidth={1}
              maxBarSize={26}
              radius={i === JOB_STATUSES.length - 1 ? [4, 4, 0, 0] : 0}
              onClick={pickMonth}
              className="cursor-pointer"
              opacity={filters.status === "all" || filters.status === status ? 1 : 0.35}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
