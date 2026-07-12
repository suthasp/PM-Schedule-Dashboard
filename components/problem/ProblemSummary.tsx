"use client";

import { useMemo, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { ChartCard } from "@/components/ui/ChartCard";
import { useChartTheme } from "@/hooks/useChartTheme";
import { PROBLEM_SUMMARY } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { formatNumber, formatPercent } from "@/utils/format";
import { resolveProblemFields } from "@/utils/problemTransform";

interface SiteStat {
  site: string;
  total: number;
  finished: number;
  inProgress: number;
  pct: number;
}

interface Summary {
  total: number;
  finished: number;
  inProgress: number;
  inAmc: number;
  inR: number;
  out: number;
  sites: SiteStat[];
  subCauses: { cause: string; count: number }[];
}

function summarize(data: ProblemData): Summary {
  const { site: siteField, workStatus: statusField, scope: scopeField, subCause: causeField } =
    resolveProblemFields(data);

  const bySite = new Map<string, SiteStat>();
  const byCause = new Map<string, number>();
  let finished = 0;
  let inAmc = 0;
  let inR = 0;
  let out = 0;

  for (const row of data.rows) {
    const isFinished = /^finish/i.test(statusField ? (row.values[statusField] ?? "") : "");
    if (isFinished) finished++;

    const scope = scopeField ? (row.values[scopeField] ?? "").trim() : "";
    if (/^in\s*\(?\s*amc/i.test(scope)) inAmc++;
    else if (/^in\s*\(?\s*r/i.test(scope)) inR++;
    else if (/^out/i.test(scope)) out++;

    const site = siteField ? (row.values[siteField] ?? "").trim() : "";
    if (site) {
      const stat = bySite.get(site) ?? { site, total: 0, finished: 0, inProgress: 0, pct: 0 };
      stat.total++;
      if (isFinished) stat.finished++;
      bySite.set(site, stat);
    }

    const cause = causeField ? (row.values[causeField] ?? "").trim() : "";
    if (cause) byCause.set(cause, (byCause.get(cause) ?? 0) + 1);
  }

  const sites = [...bySite.values()]
    .map((s) => ({
      ...s,
      inProgress: s.total - s.finished,
      pct: s.total === 0 ? 0 : (s.finished / s.total) * 100,
    }))
    .sort((a, b) => b.total - a.total || a.site.localeCompare(b.site));

  const causesSorted = [...byCause.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const subCauses = causesSorted.slice(0, 10).map(([cause, count]) => ({ cause, count }));
  const othersCount = causesSorted.slice(10).reduce((sum, [, count]) => sum + count, 0);
  if (othersCount > 0) subCauses.push({ cause: "Others", count: othersCount });

  return { total: data.rows.length, finished, inProgress: data.rows.length - finished, inAmc, inR, out, sites, subCauses };
}

function StatTile({
  label,
  value,
  note,
  bg,
  fg,
}: {
  label: string;
  value: number;
  note?: string;
  bg: string;
  fg: string;
}): ReactNode {
  return (
    <div className="card overflow-hidden text-center">
      <p className="px-2 py-1.5 text-xs font-bold" style={{ backgroundColor: bg, color: fg }}>
        {label}
      </p>
      <p className="px-2 pt-2 text-3xl font-extrabold tabular-nums" style={{ color: bg }}>
        {formatNumber(value)}
      </p>
      <p className="text-muted px-2 pb-2 pt-0.5 text-[11px]">{note ?? " "}</p>
    </div>
  );
}

function ScopeTile({
  label,
  value,
  note,
  bg,
  ink,
}: {
  label: string;
  value: number;
  note: string;
  bg: { light: string; dark: string };
  ink: { light: string; dark: string };
}): ReactNode {
  const { dark } = useChartTheme();
  const mode = dark ? "dark" : "light";
  return (
    <div
      className="card flex flex-col justify-between text-center"
      style={{ backgroundColor: bg[mode] }}
    >
      <p className="px-2 pt-1.5 text-xs font-bold" style={{ color: ink[mode] }}>
        {label}
      </p>
      <p className="px-2 text-3xl font-extrabold tabular-nums" style={{ color: ink[mode] }}>
        {formatNumber(value)}
      </p>
      <p className="px-2 pb-2 text-[11px]" style={{ color: ink[mode], opacity: 0.75 }}>
        {note}
      </p>
    </div>
  );
}

/** Executive summary above the Problem grid: KPI + scope tiles, per-site and top-cause tables, status donut. `children` renders between the tile row and the report cards. */
export function ProblemSummary({
  data,
  children,
}: {
  data: ProblemData;
  children?: ReactNode;
}): ReactNode {
  const theme = useChartTheme();
  const s = useMemo(() => summarize(data), [data]);

  const donut = [
    { name: "Finished", value: s.finished, color: PROBLEM_SUMMARY.finished.bg },
    { name: "In Progress", value: s.inProgress, color: PROBLEM_SUMMARY.inProgress.bg },
  ].filter((d) => d.value > 0);

  const hairline = { borderColor: "var(--hairline)" } as const;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Problem"
          value={s.total}
          note={`Total: ${formatNumber(s.total)} cases`}
          bg={PROBLEM_SUMMARY.problem.bg}
          fg={PROBLEM_SUMMARY.problem.fg}
        />
        <StatTile
          label="Finished"
          value={s.finished}
          note={s.total > 0 ? `(${formatPercent((s.finished / s.total) * 100, 0)})` : undefined}
          bg={PROBLEM_SUMMARY.finished.bg}
          fg={PROBLEM_SUMMARY.finished.fg}
        />
        <StatTile
          label="In Progress"
          value={s.inProgress}
          note={s.total > 0 ? `(${formatPercent((s.inProgress / s.total) * 100, 0)})` : undefined}
          bg={PROBLEM_SUMMARY.inProgress.bg}
          fg={PROBLEM_SUMMARY.inProgress.fg}
        />
        <ScopeTile label="In (AMC)" value={s.inAmc} note="In(AMC) items" bg={PROBLEM_SUMMARY.scopeAmc.bg} ink={PROBLEM_SUMMARY.scopeAmc.ink} />
        <ScopeTile label="In (R)" value={s.inR} note="In(R) items" bg={PROBLEM_SUMMARY.scopeR.bg} ink={PROBLEM_SUMMARY.scopeR.ink} />
        <ScopeTile label="Out" value={s.out} note="Out of scope" bg={PROBLEM_SUMMARY.scopeOut.bg} ink={PROBLEM_SUMMARY.scopeOut.ink} />
      </div>

      {children}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Site Summary" subtitle="Problems per site with completion">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b" style={hairline}>
                  <th className="px-2 py-1.5 text-left">Site</th>
                  <th className="px-2 py-1.5 text-right">Total</th>
                  <th className="px-2 py-1.5 text-right">Finished</th>
                  <th className="px-2 py-1.5 text-right">In Progress</th>
                  <th className="px-2 py-1.5 text-right">% Done</th>
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
                    <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(row.total)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: PROBLEM_SUMMARY.finished.bg }}>
                      {formatNumber(row.finished)}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: PROBLEM_SUMMARY.inProgress.bg }}>
                      {formatNumber(row.inProgress)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-semibold tabular-nums">
                      {formatPercent(row.pct, 0)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 font-bold" style={hairline}>
                  <td className="px-2 py-1.5">Total</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatNumber(s.total)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: PROBLEM_SUMMARY.finished.bg }}>
                    {formatNumber(s.finished)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums" style={{ color: PROBLEM_SUMMARY.inProgress.bg }}>
                    {formatNumber(s.inProgress)}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {s.total > 0 ? formatPercent((s.finished / s.total) * 100, 0) : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Sub Cause (Top 10)" subtitle="Most frequent problem causes">
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

        <ChartCard title="Status Overview" subtitle="Finished vs in progress">
          {s.total === 0 ? (
            <p className="text-muted py-16 text-center text-sm">No problems recorded.</p>
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
                                donut.find((d) => d.name === slice.name)?.color ??
                                theme.ink.primary,
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
                      {formatNumber(d.value)} ({formatPercent((d.value / s.total) * 100, 0)})
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
