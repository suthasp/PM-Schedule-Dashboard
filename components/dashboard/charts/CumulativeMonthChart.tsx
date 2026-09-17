"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { useFilters } from "@/components/providers/FilterProvider";
import { useChartTheme } from "@/hooks/useChartTheme";
import { SITE_COMPLETION } from "@/lib/constants";
import { JOB_STATUSES, type ScheduleData } from "@/types/schedule";
import { formatNumber } from "@/utils/format";
import { jobMatchesFilters } from "@/utils/transform";

interface MonthPoint {
  /** Axis label, e.g. "2025/07". */
  key: string;
  /** Sheet month name, used when the bar toggles the month filter. */
  month: string;
  Finished: number;
  Remaining: number;
  Overdue: number;
  total: number;
  cumulative: number;
  [k: string]: string | number;
}

const MONTH_PREFIXES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/** "July" + 2025 → "2025/07"; an unrecognised month name is left as-is. */
function monthKey(name: string, year: number): string {
  const i = MONTH_PREFIXES.indexOf(name.trim().toLowerCase().slice(0, 3));
  return i === -1 ? name : `${year}/${String(i + 1).padStart(2, "0")}`;
}

/**
 * Jobs per fiscal month stacked by status, with the running total of
 * scheduled jobs on a second axis. Clicking a bar toggles the month filter.
 */
export function CumulativeMonthChart({ data }: { data: ScheduleData }): ReactNode {
  const theme = useChartTheme();
  const { filters, toggleFilter } = useFilters();
  const lineColor = SITE_COMPLETION.plan[theme.dark ? "dark" : "light"];

  const points = useMemo<MonthPoint[]>(() => {
    // Every other filter applies, but not month/week — a cumulative curve only
    // reads correctly when all months stay in view.
    const scope = { ...filters, month: "all" as const, week: "all" as const };
    const yearOf = new Map<string, number>();
    for (const w of data.weeks) if (!yearOf.has(w.month)) yearOf.set(w.month, w.year);

    const rows = data.months.map<MonthPoint>((month) => ({
      key: monthKey(month, yearOf.get(month) ?? 0),
      month,
      Finished: 0,
      Remaining: 0,
      Overdue: 0,
      total: 0,
      cumulative: 0,
    }));
    const byMonth = new Map(rows.map((r) => [r.month, r]));

    for (const job of data.jobs) {
      if (!jobMatchesFilters(job, scope)) continue;
      const row = byMonth.get(job.week.month);
      if (!row) continue;
      row[job.status] = Number(row[job.status]) + 1;
      row.total++;
    }

    let running = 0;
    for (const row of rows) {
      running += row.total;
      row.cumulative = running;
    }
    return rows;
  }, [data.jobs, data.months, data.weeks, filters]);

  const grandTotal = points[points.length - 1]?.cumulative ?? 0;

  const pickMonth = (_: unknown, index: number): void => {
    const row = points[index];
    if (row) toggleFilter("month", row.month);
  };

  const legend = [
    ...JOB_STATUSES.map((s) => ({ name: s, color: theme.statusColor(s), line: false })),
    { name: "Cumulative scheduled", color: lineColor, line: true },
  ];

  return (
    <div className="flex h-80 flex-col">
      <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {legend.map((l) => (
          <li key={l.name} className="flex items-center gap-1.5">
            <span
              className={l.line ? "h-0.5 w-4 rounded" : "h-2.5 w-2.5 rounded-sm"}
              style={{ backgroundColor: l.color }}
              aria-hidden
            />
            <span className="text-secondary">{l.name}</span>
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 22, right: 4, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.ink.grid} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={{ stroke: theme.ink.grid }}
            interval={0}
            tick={{ fontSize: 10, fill: theme.ink.muted }}
          />
          <YAxis
            yAxisId="jobs"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fontSize: 10, fill: theme.ink.muted }}
          />
          <YAxis
            yAxisId="cum"
            orientation="right"
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={44}
            tick={{ fontSize: 10, fill: theme.ink.muted }}
          />
          <Tooltip
            cursor={{ fill: theme.dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.04)" }}
            content={({ active, payload, label }) => {
              const row = active ? (payload?.[0]?.payload as MonthPoint | undefined) : undefined;
              if (!row) return null;
              return (
                <ChartTooltip
                  label={`${String(label)} · ${row.month}`}
                  rows={[
                    ...JOB_STATUSES.filter((s) => row[s] !== 0).map((s) => ({
                      name: s,
                      value: Number(row[s]),
                      color: theme.statusColor(s),
                    })),
                    { name: "Month total", value: row.total },
                    { name: "Cumulative", value: row.cumulative, color: lineColor },
                  ]}
                />
              );
            }}
          />
          {JOB_STATUSES.map((status, i) => {
            const last = i === JOB_STATUSES.length - 1;
            return (
              <Bar
                key={status}
                yAxisId="jobs"
                dataKey={status}
                stackId="jobs"
                fill={theme.statusColor(status)}
                stroke={theme.surface}
                strokeWidth={1}
                maxBarSize={44}
                radius={last ? [4, 4, 0, 0] : 0}
                onClick={pickMonth}
                className="cursor-pointer"
                opacity={filters.status === "all" || filters.status === status ? 1 : 0.35}
              >
                {last && (
                  <LabelList
                    dataKey="total"
                    position="top"
                    formatter={(v: number) => (v > 0 ? formatNumber(v) : "")}
                    style={{ fontSize: 10, fill: theme.ink.secondary, fontWeight: 600 }}
                  />
                )}
              </Bar>
            );
          })}
          <Line
            yAxisId="cum"
            type="linear"
            dataKey="cumulative"
            name="Cumulative scheduled"
            stroke={lineColor}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={{ r: 3, fill: lineColor, stroke: lineColor }}
            activeDot={{ r: 5, stroke: theme.surface, strokeWidth: 2 }}
          >
            {/* Haloed so the running total stays readable where it crosses a bar. */}
            <LabelList
              dataKey="cumulative"
              position="top"
              offset={8}
              formatter={(v: number) => (v > 0 ? formatNumber(v) : "")}
              style={{
                fontSize: 9,
                fill: lineColor,
                fontWeight: 600,
                stroke: theme.surface,
                strokeWidth: 3,
                paintOrder: "stroke",
              }}
            />
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
      <p className="text-muted mt-1 text-xs">
        {formatNumber(grandTotal)} scheduled PM jobs across the fiscal year
      </p>
    </div>
  );
}
