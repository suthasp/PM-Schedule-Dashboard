"use client";

import { useMemo, type ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { PMJob, ScheduleData } from "@/types/schedule";

interface TrendPoint {
  week: string;
  month: string;
  Scheduled: number;
  Completed: number;
}

const SERIES = [
  { key: "Scheduled" as const, colorLight: "#2a78d6", colorDark: "#3987e5" },
  { key: "Completed" as const, colorLight: "#008300", colorDark: "#008300" },
];

/** Cumulative scheduled vs completed jobs across the fiscal-year weeks. */
export function TrendLineChart({
  jobs,
  data,
}: {
  jobs: PMJob[];
  data: ScheduleData;
}): ReactNode {
  const theme = useChartTheme();

  const points = useMemo<TrendPoint[]>(() => {
    let scheduled = 0;
    let completed = 0;
    return data.weeks.map((w) => {
      for (const j of jobs) {
        if (j.week.index === w.index) {
          scheduled++;
          if (j.status === "Completed") completed++;
        }
      }
      return { week: w.label, month: w.month, Scheduled: scheduled, Completed: completed };
    });
  }, [jobs, data.weeks]);

  return (
    <div className="flex h-64 flex-col">
      <ul className="mb-1 flex gap-4 text-xs">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 rounded"
              style={{ backgroundColor: theme.dark ? s.colorDark : s.colorLight }}
              aria-hidden
            />
            <span className="text-secondary">{s.key} (cumulative)</span>
          </li>
        ))}
      </ul>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.ink.grid} />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={{ stroke: theme.ink.grid }}
            ticks={points.filter((_, i) => i % 4 === 0).map((p) => p.week)}
          />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = points.find((p) => p.week === label);
              return (
                <ChartTooltip
                  label={`${String(label)}${point ? ` · ${point.month}` : ""}`}
                  rows={payload.map((p) => ({
                    name: String(p.name),
                    value: Number(p.value),
                    color: String(p.color),
                  }))}
                />
              );
            }}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={theme.dark ? s.colorDark : s.colorLight}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: theme.surface, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
