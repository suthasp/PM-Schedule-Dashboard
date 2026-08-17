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
import type { ScheduleData } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";
import { jobMatchesFilters } from "@/utils/transform";

interface SiteRow {
  site: string;
  /** Compact axis label — the shared "CNO-" prefix carries no information here. */
  label: string;
  plan: number;
  actual: number;
  pct: number;
}

function shortSiteLabel(site: string): string {
  return site.replace(/^CNO-/i, "");
}

const hairline = { borderColor: "var(--hairline)" } as const;

export function SiteCompletionCombo({ data }: { data: ScheduleData }): ReactNode {
  const theme = useChartTheme();
  const { filters, toggleSite } = useFilters();
  const mode = theme.dark ? "dark" : "light";
  const planColor = SITE_COMPLETION.plan[mode];
  const actualColor = SITE_COMPLETION.actual[mode];
  const pctColor = SITE_COMPLETION.pct[mode];

  // Respect every filter except the site itself, so all rows stay comparable.
  const rows = useMemo<SiteRow[]>(() => {
    const scope = { ...filters, site: [] };
    const plan = new Map<string, number>(data.sites.map((s) => [s, 0]));
    const actual = new Map<string, number>(data.sites.map((s) => [s, 0]));
    for (const job of data.jobs) {
      if (!jobMatchesFilters(job, scope)) continue;
      if (!plan.has(job.site)) continue;
      plan.set(job.site, (plan.get(job.site) ?? 0) + 1);
      if (job.status === "Finished") actual.set(job.site, (actual.get(job.site) ?? 0) + 1);
    }
    return data.sites.map((site) => {
      const p = plan.get(site) ?? 0;
      const a = actual.get(site) ?? 0;
      return { site, label: shortSiteLabel(site), plan: p, actual: a, pct: p === 0 ? 0 : (a / p) * 100 };
    });
  }, [data.jobs, data.sites, filters]);

  const totals = useMemo(() => {
    const plan = rows.reduce((sum, r) => sum + r.plan, 0);
    const actual = rows.reduce((sum, r) => sum + r.actual, 0);
    return { plan, actual, pct: plan === 0 ? 0 : (actual / plan) * 100 };
  }, [rows]);

  const headerCell = "px-2 py-1.5 text-xs font-bold";
  const legend = [
    { name: "Plan", color: planColor },
    { name: "Actual", color: actualColor },
    { name: "% Finished", color: pctColor },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ backgroundColor: SITE_COMPLETION.header.bg }}>
              <th className={`${headerCell} text-left`} style={{ color: SITE_COMPLETION.header.fg }}>
                Site
              </th>
              <th className={`${headerCell} text-right`} style={{ color: SITE_COMPLETION.header.fg }}>
                Plan
              </th>
              <th className={`${headerCell} text-right`} style={{ color: SITE_COMPLETION.header.fg }}>
                Actual
              </th>
              <th className={`${headerCell} text-right`} style={{ color: SITE_COMPLETION.header.fg }}>
                % Finished
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const active = filters.site.includes(row.site);
              return (
                <tr
                  key={row.site}
                  onClick={() => toggleSite(row.site)}
                  aria-selected={active}
                  className={`cursor-pointer border-b transition-colors odd:bg-black/[0.03] hover:bg-black/[0.06] dark:odd:bg-white/[0.03] dark:hover:bg-white/[0.08] ${
                    active ? "bg-accent/10 dark:bg-accent-dark/15" : ""
                  }`}
                  style={hairline}
                >
                  <td className="whitespace-nowrap px-2 py-1.5 font-semibold">{row.site}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(row.plan)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(row.actual)}</td>
                  <td
                    className="px-2 py-1.5 text-right font-semibold tabular-nums"
                    style={{ color: pctColor }}
                  >
                    {formatPercent(row.pct, 2)}
                  </td>
                </tr>
              );
            })}
            <tr
              className="border-t-2 font-bold"
              style={{ ...hairline, backgroundColor: SITE_COMPLETION.totalTint }}
            >
              <td className="px-2 py-1.5">Total</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(totals.plan)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(totals.actual)}</td>
              <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: pctColor }}>
                {formatPercent(totals.pct, 2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex h-80 flex-col lg:col-span-2">
        <ul className="mb-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
          {legend.map((l) => (
            <li key={l.name} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: l.color }}
                aria-hidden
              />
              <span className="text-secondary">{l.name}</span>
            </li>
          ))}
        </ul>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 18, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={theme.ink.grid} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: theme.ink.grid }}
              interval={0}
              tick={{ fontSize: 10, fill: theme.ink.muted }}
            />
            <YAxis
              yAxisId="count"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tick={{ fontSize: 10, fill: theme.ink.muted }}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tickLine={false}
              axisLine={false}
              domain={[0, "auto"]}
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
                        name: "% Finished",
                        value: row.pct,
                        color: pctColor,
                        format: (v) => formatPercent(v, 2),
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar yAxisId="count" dataKey="plan" name="Plan" fill={planColor} maxBarSize={34}>
              <LabelList
                dataKey="plan"
                position="top"
                formatter={(v: number) => (v > 0 ? formatNumber(v) : "")}
                style={{ fontSize: 9, fill: theme.ink.secondary }}
              />
            </Bar>
            <Bar yAxisId="count" dataKey="actual" name="Actual" fill={actualColor} maxBarSize={34}>
              <LabelList
                dataKey="actual"
                position="top"
                formatter={(v: number) => (v > 0 ? formatNumber(v) : "")}
                style={{ fontSize: 9, fill: theme.ink.secondary }}
              />
            </Bar>
            <Line
              yAxisId="pct"
              type="linear"
              dataKey="pct"
              name="% Finished"
              stroke={pctColor}
              strokeWidth={2}
              dot={{ r: 3, fill: pctColor, stroke: pctColor }}
            >
              <LabelList
                dataKey="pct"
                position="top"
                offset={8}
                formatter={(v: number) => formatPercent(v, 2)}
                // Halo in the card colour so the label stays legible where the
                // line crosses a bar.
                style={{
                  fontSize: 9,
                  fill: pctColor,
                  fontWeight: 600,
                  stroke: theme.surface,
                  strokeWidth: 3,
                  paintOrder: "stroke",
                }}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
