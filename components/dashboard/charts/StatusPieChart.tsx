"use client";

import { useMemo, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { useFilters } from "@/components/providers/FilterProvider";
import { useChartTheme } from "@/hooks/useChartTheme";
import { JOB_STATUSES, type JobStatus, type PMJob } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";

interface Slice {
  status: JobStatus;
  count: number;
}

/** Donut of job statuses; clicking a slice (or legend row) toggles the status filter. */
export function StatusPieChart({ jobs }: { jobs: PMJob[] }): ReactNode {
  const theme = useChartTheme();
  const { filters, toggleFilter } = useFilters();

  const slices = useMemo<Slice[]>(
    () =>
      JOB_STATUSES.map((status) => ({
        status,
        count: jobs.filter((j) => j.status === status).length,
      })).filter((s) => s.count > 0),
    [jobs],
  );
  const total = slices.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return <p className="text-muted py-16 text-center text-sm">No jobs match the filters.</p>;
  }

  return (
    <div className="flex h-64 flex-col">
      <ResponsiveContainer width="100%" height="70%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="count"
            nameKey="status"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={1.5}
            stroke={theme.surface}
            strokeWidth={2}
            onClick={(_: unknown, index: number) => {
              const slice = slices[index];
              if (slice) toggleFilter("status", slice.status);
            }}
            className="cursor-pointer"
          >
            {slices.map((s) => (
              <Cell
                key={s.status}
                fill={theme.statusColor(s.status)}
                opacity={filters.status === "all" || filters.status === s.status ? 1 : 0.35}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <ChartTooltip
                  rows={[
                    {
                      name: String(payload[0].name),
                      value: Number(payload[0].value),
                      color: theme.statusColor(payload[0].name as JobStatus),
                    },
                  ]}
                />
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {slices.map((s) => (
          <li key={s.status}>
            <button
              type="button"
              onClick={() => toggleFilter("status", s.status)}
              className={`flex items-center gap-1.5 transition-opacity ${
                filters.status !== "all" && filters.status !== s.status ? "opacity-40" : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: theme.statusColor(s.status) }}
                aria-hidden
              />
              <span className="text-secondary">{s.status}</span>
              <span className="font-semibold tabular-nums">
                {formatNumber(s.count)} ({formatPercent((s.count / total) * 100, 0)})
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
