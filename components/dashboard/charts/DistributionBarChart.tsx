"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { useChartTheme } from "@/hooks/useChartTheme";
import type { PMJob } from "@/types/schedule";

interface DistributionBarChartProps {
  jobs: PMJob[];
  /** Which job dimension to count by. */
  dimension: (job: PMJob) => string;
  /** Fixed domain so bars don't vanish when filtered to zero. */
  domain: string[];
  /** Categorical slot index for the single-series hue. */
  colorSlot: number;
  activeValue: string | "all";
  onSelect: (value: string) => void;
  /** Bars per row height; chart grows with the domain size. */
  sortByCount?: boolean;
}

interface Datum {
  name: string;
  count: number;
}

/**
 * Single-series horizontal bar chart for identity dimensions (category, site,
 * duty cycle). Clicking a bar toggles the matching global filter.
 */
export function DistributionBarChart({
  jobs,
  dimension,
  domain,
  colorSlot,
  activeValue,
  onSelect,
  sortByCount = true,
}: DistributionBarChartProps): ReactNode {
  const theme = useChartTheme();
  const color = theme.categorical[colorSlot % theme.categorical.length] ?? "#2a78d6";

  const rows = useMemo<Datum[]>(() => {
    const counts = new Map<string, number>(domain.map((d) => [d, 0]));
    for (const j of jobs) {
      const key = dimension(j);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const list = [...counts.entries()].map(([name, count]) => ({ name, count }));
    return sortByCount ? list.sort((a, b) => b.count - a.count) : list;
  }, [jobs, dimension, domain, sortByCount]);

  const height = Math.max(180, rows.length * 30 + 30);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 42, left: 8, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke={theme.ink.grid} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tickLine={false}
            axisLine={{ stroke: theme.ink.grid }}
            tick={{ fill: theme.ink.secondary, fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: theme.dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.04)" }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <ChartTooltip
                  rows={[
                    {
                      name: String(payload[0].payload?.name ?? ""),
                      value: Number(payload[0].value),
                      color,
                    },
                  ]}
                />
              ) : null
            }
          />
          <Bar
            dataKey="count"
            fill={color}
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            onClick={(_: unknown, index: number) => {
              const row = rows[index];
              if (row) onSelect(row.name);
            }}
            className="cursor-pointer"
          >
            {rows.map((r) => (
              <Cell
                key={r.name}
                opacity={activeValue === "all" || activeValue === r.name ? 1 : 0.35}
              />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              formatter={(v: number) => (v > 0 ? v.toLocaleString() : "")}
              style={{ fill: theme.ink.muted, fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
