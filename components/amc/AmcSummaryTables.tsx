"use client";

import { useMemo, type ReactNode } from "react";
import { useChartTheme } from "@/hooks/useChartTheme";
import { SITE_COMPLETION, STATUS_COLORS } from "@/lib/constants";
import type { PMJob, ScheduleData } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";

interface SummaryRow {
  key: string;
  plan: number;
  actual: number;
  remain: number;
  pct: number;
}

/**
 * Aggregate scheduled jobs by one dimension. `order` fixes the row order to
 * how the dimension first appears in the sheet, so the report reads the same
 * way as the source spreadsheet; dimensions with nothing planned drop out.
 */
function aggregate(jobs: PMJob[], pick: (j: PMJob) => string, order: string[]): SummaryRow[] {
  const plan = new Map<string, number>();
  const actual = new Map<string, number>();
  for (const job of jobs) {
    const key = pick(job);
    if (key === "") continue;
    plan.set(key, (plan.get(key) ?? 0) + 1);
    if (job.status === "Finished") actual.set(key, (actual.get(key) ?? 0) + 1);
  }
  return order
    .filter((key) => (plan.get(key) ?? 0) > 0)
    .map((key) => {
      const p = plan.get(key) ?? 0;
      const a = actual.get(key) ?? 0;
      // "Remain" here means not-yet-done — Remaining and Overdue together.
      return { key, plan: p, actual: a, remain: p - a, pct: p === 0 ? 0 : (a / p) * 100 };
    });
}

const hairline = { borderColor: "var(--hairline)" } as const;

function SummaryTable({
  label,
  rows,
}: {
  /** Header of the first column, e.g. "Site". */
  label: string;
  rows: SummaryRow[];
}): ReactNode {
  const { dark } = useChartTheme();
  const overdue = STATUS_COLORS.Overdue[dark ? "dark" : "light"];

  const total = useMemo(() => {
    const plan = rows.reduce((s, r) => s + r.plan, 0);
    const actual = rows.reduce((s, r) => s + r.actual, 0);
    return { plan, actual, remain: plan - actual, pct: plan === 0 ? 0 : (actual / plan) * 100 };
  }, [rows]);

  if (rows.length === 0) {
    return <p className="text-muted py-8 text-center text-sm">No jobs match the current filters.</p>;
  }

  const headerCell = "whitespace-nowrap border px-2 py-1.5 text-xs font-bold";
  const cell = "border px-2 py-1 text-right tabular-nums";
  // A zero completion rate is the thing to notice, so it carries the alert ink.
  const pctInk = (pct: number): string | undefined => (pct === 0 ? overdue : undefined);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr
            style={{
              backgroundColor: SITE_COMPLETION.header.bg,
              color: SITE_COMPLETION.header.fg,
            }}
          >
            <th className={`${headerCell} text-left`} style={hairline}>
              {label}
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              Plan
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              Actual
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              Remain
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              % Completed
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="border px-2 py-1" style={hairline}>
                {r.key}
              </td>
              <td className={cell} style={hairline}>
                {formatNumber(r.plan)}
              </td>
              <td className={cell} style={hairline}>
                {formatNumber(r.actual)}
              </td>
              <td className={cell} style={hairline}>
                {formatNumber(r.remain)}
              </td>
              <td className={`${cell} font-semibold`} style={{ ...hairline, color: pctInk(r.pct) }}>
                {formatPercent(r.pct)}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: SITE_COMPLETION.totalTint }}>
            <td className="border px-2 py-1 font-bold" style={hairline}>
              รวม
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatNumber(total.plan)}
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatNumber(total.actual)}
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatNumber(total.remain)}
            </td>
            <td className={`${cell} font-bold`} style={{ ...hairline, color: pctInk(total.pct) }}>
              {formatPercent(total.pct)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Plan / Actual / Remain roll-ups by site and by equipment system. */
export function AmcSiteSummary({ data, jobs }: { data: ScheduleData; jobs: PMJob[] }): ReactNode {
  const order = useMemo(
    () => [...new Set(data.tasks.map((t) => t.values[data.fields.site] ?? ""))],
    [data],
  );
  return <SummaryTable label="Site" rows={aggregate(jobs, (j) => j.site, order)} />;
}

export function AmcSystemSummary({ data, jobs }: { data: ScheduleData; jobs: PMJob[] }): ReactNode {
  const order = useMemo(
    () => [...new Set(data.tasks.map((t) => t.values[data.fields.workInstruction] ?? ""))],
    [data],
  );
  return <SummaryTable label="System" rows={aggregate(jobs, (j) => j.workInstruction, order)} />;
}
