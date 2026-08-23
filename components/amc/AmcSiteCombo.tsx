"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { useChartTheme } from "@/hooks/useChartTheme";
import { SITE_COMPLETION } from "@/lib/constants";
import type { PMJob, ScheduleData } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";

interface SiteRow {
  site: string;
  plan: number;
  actual: number;
  pct: number;
}

/**
 * The plot area is inset by these gutters, and the data table underneath uses
 * matching first/last columns — that is what lines its site columns up with
 * the bars. The left one is wider because it also has to hold "% Completed".
 */
const LEFT_GUTTER = 96;
const RIGHT_GUTTER = 46;
const Y_AXIS_WIDTH = 46;
/** Smallest readable width for a site column, e.g. "CNO-TTW1". */
const MIN_SITE_COL = 58;

/** Plan vs actual per site, with the completion rate on a second axis. */
export function AmcSiteCombo({ data, jobs }: { data: ScheduleData; jobs: PMJob[] }): ReactNode {
  const theme = useChartTheme();
  const mode = theme.dark ? "dark" : "light";
  const planColor = SITE_COMPLETION.plan[mode];
  const actualColor = SITE_COMPLETION.actual[mode];
  const pctColor = SITE_COMPLETION.pct[mode];

  const rows = useMemo<SiteRow[]>(() => {
    // Sheet order, so the chart reads the same way as the summary tables.
    const order = [...new Set(data.tasks.map((t) => t.values[data.fields.site] ?? ""))];
    const plan = new Map<string, number>();
    const actual = new Map<string, number>();
    for (const job of jobs) {
      plan.set(job.site, (plan.get(job.site) ?? 0) + 1);
      if (job.status === "Finished") actual.set(job.site, (actual.get(job.site) ?? 0) + 1);
    }
    return order
      .filter((site) => (plan.get(site) ?? 0) > 0)
      .map((site) => {
        const p = plan.get(site) ?? 0;
        const a = actual.get(site) ?? 0;
        return { site, plan: p, actual: a, pct: p === 0 ? 0 : (a / p) * 100 };
      });
  }, [data.tasks, data.fields.site, jobs]);

  if (rows.length === 0) {
    return <p className="text-muted py-8 text-center text-sm">No jobs match the current filters.</p>;
  }

  const legend = [
    { name: "Plan", color: planColor, line: false },
    { name: "Actual", color: actualColor, line: false },
    { name: "% Completed", color: pctColor, line: true },
  ];

  const series: { name: string; color: string; line: boolean; value: (r: SiteRow) => string }[] = [
    { ...legend[0]!, value: (r) => formatNumber(r.plan) },
    { ...legend[1]!, value: (r) => formatNumber(r.actual) },
    { ...legend[2]!, value: (r) => formatPercent(r.pct) },
  ];

  const minWidth = LEFT_GUTTER + RIGHT_GUTTER + rows.length * MIN_SITE_COL;

  return (
    <div style={{ minWidth }}>
      <ul className="mb-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {legend.map((l) => (
          <li key={l.name} className="flex items-center gap-1.5">
            <span
              className={l.line ? "h-0.5 w-4" : "h-2.5 w-2.5 rounded-sm"}
              style={{ backgroundColor: l.color }}
              aria-hidden
            />
            <span className="text-secondary">{l.name}</span>
          </li>
        ))}
      </ul>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 16, right: RIGHT_GUTTER - Y_AXIS_WIDTH, left: LEFT_GUTTER - Y_AXIS_WIDTH, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke={theme.ink.grid} />
            {/* Site names live in the data table below, as in the source report. */}
            <XAxis dataKey="site" tick={false} height={1} axisLine={{ stroke: theme.ink.grid }} />
            <YAxis
              yAxisId="count"
              width={Y_AXIS_WIDTH}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fontSize: 10, fill: theme.ink.muted }}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              width={Y_AXIS_WIDTH}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(v: number) => formatPercent(v, 0)}
              tick={{ fontSize: 10, fill: theme.ink.muted }}
            />
            <Tooltip
              cursor={{ fill: theme.dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.04)" }}
              content={({ active, payload, label }) => {
                const row = active ? (payload?.[0]?.payload as SiteRow | undefined) : undefined;
                if (!row) return null;
                return (
                  <ChartTooltip
                    label={String(label)}
                    rows={[
                      { name: "Plan", value: row.plan, color: planColor },
                      { name: "Actual", value: row.actual, color: actualColor },
                      {
                        name: "% Completed",
                        value: row.pct,
                        color: pctColor,
                        format: (v) => formatPercent(v),
                      },
                    ]}
                  />
                );
              }}
            />
            {/* No data labels — the table below already carries every value. */}
            <Bar yAxisId="count" dataKey="plan" name="Plan" fill={planColor} maxBarSize={26} />
            <Bar yAxisId="count" dataKey="actual" name="Actual" fill={actualColor} maxBarSize={26} />
            <Line
              yAxisId="pct"
              type="linear"
              dataKey="pct"
              name="% Completed"
              stroke={pctColor}
              strokeWidth={2}
              dot={{ r: 3, fill: pctColor, stroke: pctColor }}
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Excel-style data table: columns line up under the bars. */}
      <table className="w-full table-fixed border-collapse text-[10px]">
        <colgroup>
          <col style={{ width: LEFT_GUTTER }} />
          {rows.map((r) => (
            <col key={r.site} />
          ))}
          <col style={{ width: RIGHT_GUTTER }} />
        </colgroup>
        <thead>
          <tr>
            <th className="border px-1 py-1" style={{ borderColor: "var(--hairline)" }} />
            {rows.map((r) => (
              <th
                key={r.site}
                className="truncate border px-0.5 py-1 text-center text-[9px] font-semibold"
                style={{ borderColor: "var(--hairline)" }}
                title={r.site}
              >
                {r.site}
              </th>
            ))}
            <th className="border px-1 py-1" style={{ borderColor: "var(--hairline)" }} />
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.name}>
              <td
                className="flex items-center gap-1.5 whitespace-nowrap border px-1 py-1"
                style={{ borderColor: "var(--hairline)" }}
              >
                <span
                  className={s.line ? "h-0.5 w-3 shrink-0" : "h-2 w-2 shrink-0 rounded-sm"}
                  style={{ backgroundColor: s.color }}
                  aria-hidden
                />
                <span className="text-secondary truncate">{s.name}</span>
              </td>
              {rows.map((r) => (
                <td
                  key={r.site}
                  className="border px-1 py-1 text-center tabular-nums"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  {s.value(r)}
                </td>
              ))}
              <td className="border px-1 py-1" style={{ borderColor: "var(--hairline)" }} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
