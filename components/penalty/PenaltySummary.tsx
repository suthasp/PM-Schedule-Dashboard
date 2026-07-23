"use client";

import { useMemo, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { ChartCard } from "@/components/ui/ChartCard";
import { useChartTheme } from "@/hooks/useChartTheme";
import { PENALTY_SUMMARY } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

interface SiteStat {
  site: string;
  tickets: number;
  penaltyBaht: number;
  slaOver: number;
}

interface PenaltyFields {
  ticketId: string | null;
  ownerGroup: string | null;
  penaltyBaht: string | null;
  penaltyFlag: string | null;
  /** Column W — the activity-level SLA, not the ticket-level TICKET_SLA. */
  activitySla: string | null;
  subCause: string | null;
}

function resolvePenaltyFields(data: ProblemData): PenaltyFields {
  const find = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const hit = data.columns.find((c) => pattern.test(c.label));
      if (hit) return hit.header;
    }
    return null;
  };
  return {
    ticketId: find([/^ticketid$/i]),
    ownerGroup: find([/^trueownergroup$/i]),
    penaltyBaht: find([/^penaltybaht/i]),
    penaltyFlag: find([/^penalty_flag$/i]),
    activitySla: find([/^activity_sla$/i]),
    subCause: find([/^sub_cause$/i]),
  };
}

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

/** "TRUE-TH-WW-CN-SNK" → "CN-SNK". */
function shortSite(raw: string): string {
  return raw.replace(/^TRUE-TH-WW-/i, "").trim() || raw;
}

interface Summary {
  totalTickets: number;
  totalPenaltyBaht: number;
  charged: number;
  waived: number;
  slaWithin: number;
  slaOver: number;
  sites: SiteStat[];
  subCauses: { cause: string; count: number }[];
}

function summarize(data: ProblemData): Summary {
  const fields = resolvePenaltyFields(data);
  const bySite = new Map<string, SiteStat>();
  const byCause = new Map<string, number>();
  let totalPenaltyBaht = 0;
  let charged = 0;
  let waived = 0;
  let slaWithin = 0;
  let slaOver = 0;

  for (const row of data.rows) {
    const baht = fields.penaltyBaht ? parseAmount(row.values[fields.penaltyBaht] ?? "") : 0;
    totalPenaltyBaht += baht;
    if (baht > 0) charged++;

    const flag = fields.penaltyFlag ? (row.values[fields.penaltyFlag] ?? "").trim() : "";
    if (/waive/i.test(flag)) waived++;

    const sla = fields.activitySla ? (row.values[fields.activitySla] ?? "").trim() : "";
    const isOver = /^over/i.test(sla);
    if (/^within/i.test(sla)) slaWithin++;
    else if (isOver) slaOver++;

    if (fields.ownerGroup) {
      const site = shortSite((row.values[fields.ownerGroup] ?? "").trim());
      if (site) {
        const stat = bySite.get(site) ?? { site, tickets: 0, penaltyBaht: 0, slaOver: 0 };
        stat.tickets++;
        stat.penaltyBaht += baht;
        if (isOver) stat.slaOver++;
        bySite.set(site, stat);
      }
    }

    if (fields.subCause) {
      const cause = (row.values[fields.subCause] ?? "").trim();
      if (cause) byCause.set(cause, (byCause.get(cause) ?? 0) + 1);
    }
  }

  const sites = [...bySite.values()].sort(
    (a, b) => b.penaltyBaht - a.penaltyBaht || b.tickets - a.tickets,
  );
  const causesSorted = [...byCause.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const subCauses = causesSorted.slice(0, 10).map(([cause, count]) => ({ cause, count }));
  const othersCount = causesSorted.slice(10).reduce((sum, [, count]) => sum + count, 0);
  if (othersCount > 0) subCauses.push({ cause: "Others", count: othersCount });

  return {
    totalTickets: data.rows.length,
    totalPenaltyBaht,
    charged,
    waived,
    slaWithin,
    slaOver,
    sites,
    subCauses,
  };
}

function StatTile({
  label,
  value,
  note,
  bg,
  fg,
}: {
  label: string;
  value: string;
  note?: string;
  bg: string;
  fg: string;
}): ReactNode {
  return (
    <div className="card overflow-hidden text-center">
      <p className="px-2 py-1.5 text-xs font-bold" style={{ backgroundColor: bg, color: fg }}>
        {label}
      </p>
      <p className="px-2 pt-2 text-2xl font-extrabold tabular-nums sm:text-3xl" style={{ color: bg }}>
        {value}
      </p>
      <p className="text-muted px-2 pb-2 pt-0.5 text-[11px]">{note ?? " "}</p>
    </div>
  );
}

/** Executive summary above the Tickets Penalty grid: KPI tiles, per-site penalty table, top causes, SLA donut. */
export function PenaltySummary({ data }: { data: ProblemData }): ReactNode {
  const theme = useChartTheme();
  const s = useMemo(() => summarize(data), [data]);
  const slaTotal = s.slaWithin + s.slaOver;

  const donut = [
    { name: "Within SLA", value: s.slaWithin, color: PENALTY_SUMMARY.slaWithin },
    { name: "Over SLA", value: s.slaOver, color: PENALTY_SUMMARY.slaOver },
  ].filter((d) => d.value > 0);

  const hairline = { borderColor: "var(--hairline)" } as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Tickets"
          value={formatNumber(s.totalTickets)}
          note={`Total: ${formatNumber(s.totalTickets)} tickets`}
          bg={PENALTY_SUMMARY.tickets.bg}
          fg={PENALTY_SUMMARY.tickets.fg}
        />
        <StatTile
          label="Total Penalty"
          value={formatCurrency(s.totalPenaltyBaht)}
          note="Penalty charged (THB)"
          bg={PENALTY_SUMMARY.penalty.bg}
          fg={PENALTY_SUMMARY.penalty.fg}
        />
        <StatTile
          label="Charged"
          value={formatNumber(s.charged)}
          note={s.totalTickets > 0 ? `(${formatPercent((s.charged / s.totalTickets) * 100, 0)})` : undefined}
          bg={PENALTY_SUMMARY.charged.bg}
          fg={PENALTY_SUMMARY.charged.fg}
        />
        <StatTile
          label="Waived"
          value={formatNumber(s.waived)}
          note="Penalty Waive"
          bg={PENALTY_SUMMARY.waived.bg}
          fg={PENALTY_SUMMARY.waived.fg}
        />
        <StatTile
          label="%Clearance"
          value={
            s.totalTickets > 0 ? formatPercent((s.slaWithin / s.totalTickets) * 100, 2) : "—"
          }
          note={`${formatNumber(s.slaWithin)} of ${formatNumber(s.totalTickets)} tickets`}
          bg={PENALTY_SUMMARY.slaWithin}
          fg="#ffffff"
        />
        <StatTile
          label="SLA Over"
          value={formatNumber(s.slaOver)}
          note="Breaches"
          bg={PENALTY_SUMMARY.slaOver}
          fg="#ffffff"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Penalty by Site" subtitle="Ticket count and penalty charged per site">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b" style={hairline}>
                  <th className="px-2 py-1.5 text-left">Site</th>
                  <th className="px-2 py-1.5 text-right">Tickets</th>
                  <th className="px-2 py-1.5 text-right">Penalty</th>
                  <th className="px-2 py-1.5 text-right">SLA Over</th>
                </tr>
              </thead>
              <tbody>
                {s.sites.map((row) => (
                  <tr
                    key={row.site}
                    className="border-b odd:bg-black/[0.03] dark:odd:bg-white/[0.03]"
                    style={hairline}
                  >
                    <td className="px-2 py-1.5 font-semibold">{row.site}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(row.tickets)}</td>
                    <td
                      className="px-2 py-1.5 text-right font-semibold tabular-nums"
                      style={{ color: row.penaltyBaht > 0 ? PENALTY_SUMMARY.penalty.bg : undefined }}
                    >
                      {row.penaltyBaht > 0 ? formatCurrency(row.penaltyBaht) : "—"}
                    </td>
                    <td
                      className="px-2 py-1.5 text-right tabular-nums"
                      style={{ color: row.slaOver > 0 ? PENALTY_SUMMARY.slaOver : undefined }}
                    >
                      {formatNumber(row.slaOver)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold" style={hairline}>
                  <td className="px-2 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(s.totalTickets)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: PENALTY_SUMMARY.penalty.bg }}>
                    {formatCurrency(s.totalPenaltyBaht)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(s.slaOver)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Sub Cause (Top 10)" subtitle="Most frequent ticket causes">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b" style={hairline}>
                <th className="px-2 py-1.5 text-left">Sub Cause</th>
                <th className="px-2 py-1.5 text-right">Count</th>
              </tr>
            </thead>
            <tbody>
              {s.subCauses.map((row) => (
                <tr
                  key={row.cause}
                  className="border-b odd:bg-black/[0.03] dark:odd:bg-white/[0.03]"
                  style={hairline}
                >
                  <td className="px-2 py-1.5">{row.cause}</td>
                  <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                    {formatNumber(row.count)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>

        <ChartCard title="SLA Performance" subtitle="Activity SLA: within vs over">
          {slaTotal === 0 ? (
            <p className="text-muted py-16 text-center text-sm">No SLA data available.</p>
          ) : (
            <div className="flex h-64 flex-col">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={donut}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="88%"
                    paddingAngle={1.5}
                    stroke={theme.surface}
                    strokeWidth={2}
                  >
                    {donut.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      const slice = active ? payload?.[0] : undefined;
                      if (!slice) return null;
                      return (
                        <ChartTooltip
                          rows={[
                            {
                              name: String(slice.name),
                              value: Number(slice.value),
                              color:
                                donut.find((d) => d.name === slice.name)?.color ?? theme.ink.primary,
                            },
                          ]}
                        />
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {donut.map((d) => (
                  <li key={d.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} aria-hidden />
                    <span className="text-secondary">{d.name}</span>
                    <span className="font-semibold tabular-nums">
                      {formatNumber(d.value)} ({formatPercent((d.value / slaTotal) * 100, 0)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
