"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { ChartCard } from "@/components/ui/ChartCard";
import { useChartTheme } from "@/hooks/useChartTheme";
import { PENALTY_SUMMARY, SITE_COLORS } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { formatNumber } from "@/utils/format";

interface PendingFields {
  ownerGroup: string | null;
  slaFlagGroup: string | null;
}

function resolvePendingFields(data: ProblemData): PendingFields {
  const find = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const hit = data.columns.find((c) => pattern.test(c.label));
      if (hit) return hit.header;
    }
    return null;
  };
  return {
    ownerGroup: find([/^trueownergroup$/i]),
    slaFlagGroup: find([/^sla_flag_group$/i]),
  };
}

/** "TRUE-TH-WW-CN-SNK" → "SNK"; "TRUE-TH-WW-CLS-SKA" → "SKA". */
function shortSiteCode(raw: string): string {
  const parts = raw.trim().split("-");
  return parts[parts.length - 1] || raw;
}

interface SiteCount {
  site: string;
  count: number;
}

interface SlaBarRow {
  site: string;
  within: number;
  over: number;
  total: number;
}

interface Summary {
  siteCounts: SiteCount[];
  bars: SlaBarRow[];
}

function summarize(data: ProblemData): Summary {
  const fields = resolvePendingFields(data);
  const byShortSite = new Map<string, number>();
  const byRawSite = new Map<string, { within: number; over: number }>();

  for (const row of data.rows) {
    const raw = fields.ownerGroup ? (row.values[fields.ownerGroup] ?? "").trim() : "";
    if (!raw) continue;
    const short = shortSiteCode(raw);
    byShortSite.set(short, (byShortSite.get(short) ?? 0) + 1);

    const sla = fields.slaFlagGroup ? (row.values[fields.slaFlagGroup] ?? "").trim() : "";
    const entry = byRawSite.get(raw) ?? { within: 0, over: 0 };
    if (/over/i.test(sla)) entry.over++;
    else if (/within/i.test(sla)) entry.within++;
    byRawSite.set(raw, entry);
  }

  const siteCounts = [...byShortSite.entries()]
    .map(([site, count]) => ({ site, count }))
    .sort((a, b) => a.site.localeCompare(b.site));

  const bars = [...byRawSite.entries()]
    .map(([site, v]) => ({ site, within: v.within, over: v.over, total: v.within + v.over }))
    .sort((a, b) => b.total - a.total || a.site.localeCompare(b.site));

  return { siteCounts, bars };
}

function SiteTile({ site, count, color }: { site: string; count: number; color: string }): ReactNode {
  return (
    <div className="card overflow-hidden text-center">
      <p className="px-2 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: color }}>
        {site}
      </p>
      <p className="px-2 py-2 text-2xl font-extrabold tabular-nums" style={{ color }}>
        {formatNumber(count)}
      </p>
    </div>
  );
}

const labelStyle = { fontSize: 11, fill: "#ffffff", fontWeight: 700 } as const;
const showIfPositive = (v: number): string => (v > 0 ? String(v) : "");

/** Executive summary above the Pending Tickets grid: per-site tiles and an SLA-status stacked bar. */
export function PendingSummary({ data }: { data: ProblemData }): ReactNode {
  const theme = useChartTheme();
  const s = useMemo(() => summarize(data), [data]);

  if (s.siteCounts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${s.siteCounts.length}, minmax(90px, 1fr))` }}
      >
        {s.siteCounts.map((c, i) => (
          <SiteTile
            key={c.site}
            site={c.site}
            count={c.count}
            color={SITE_COLORS[i % SITE_COLORS.length] ?? SITE_COLORS[0]}
          />
        ))}
      </div>

      <ChartCard title="Pending Tickets by Site" subtitle="SLA status per site">
        <div className="flex h-72 flex-col">
          <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: PENALTY_SUMMARY.slaWithin }}
                aria-hidden
              />
              <span className="text-secondary">Within SLA</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: PENALTY_SUMMARY.slaOver }}
                aria-hidden
              />
              <span className="text-secondary">Over SLA</span>
            </li>
          </ul>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={s.bars} margin={{ top: 16, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={theme.ink.grid} />
              <XAxis
                dataKey="site"
                tickLine={false}
                axisLine={{ stroke: theme.ink.grid }}
                interval={0}
                tick={{ fontSize: 10, fill: theme.ink.muted }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fontSize: 10, fill: theme.ink.muted }}
              />
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
              <Bar dataKey="within" name="Within SLA" stackId="sla" fill={PENALTY_SUMMARY.slaWithin}>
                <LabelList dataKey="within" position="center" formatter={showIfPositive} style={labelStyle} />
              </Bar>
              <Bar
                dataKey="over"
                name="Over SLA"
                stackId="sla"
                fill={PENALTY_SUMMARY.slaOver}
                radius={[2, 2, 0, 0]}
              >
                <LabelList dataKey="over" position="center" formatter={showIfPositive} style={labelStyle} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
