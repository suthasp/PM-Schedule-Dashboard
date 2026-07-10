"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import { PLAN_ACTUAL_TABLE, STATUS_COLORS } from "@/lib/constants";
import type { ScheduleData } from "@/types/schedule";
import { jobMatchesFilters } from "@/utils/transform";

interface SiteBreakdown {
  site: string;
  plan: Record<string, number>;
  actual: Record<string, number>;
  planTotal: number;
  actualTotal: number;
  pct: number;
  /** Distinct duty cycles scheduled at this site. */
  dutyCount: number;
}

function pctColor(pct: number, dark: boolean): string {
  if (pct >= 80) return STATUS_COLORS.Finished.light;
  if (pct >= 50) return dark ? "#fab219" : "#a16207";
  return STATUS_COLORS.Overdue.light;
}

function formatPct(pct: number): string {
  return `${(Math.round(pct * 10) / 10).toLocaleString()}%`;
}

/**
 * Plan vs Actual pivot: one row per site, PLAN (scheduled) and ACTUAL
 * (finished) job counts per duty cycle, plus a Grand Total row. Clicking a
 * row toggles the global site filter, like the site cards.
 */
export function PlanActualTable({ data }: { data: ScheduleData }): ReactNode {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const { filters, toggleFilter } = useFilters();

  // Respect every filter except the site itself, so all rows stay comparable.
  const scopedJobs = useMemo(() => {
    const scope = { ...filters, site: "all" as const };
    return data.jobs.filter((j) => jobMatchesFilters(j, scope));
  }, [data.jobs, filters]);

  const cycles = data.dutyCycles;

  const { rows, grand } = useMemo(() => {
    const bySite = new Map<string, SiteBreakdown>();
    for (const site of data.sites) {
      bySite.set(site, {
        site,
        plan: {},
        actual: {},
        planTotal: 0,
        actualTotal: 0,
        pct: 0,
        dutyCount: 0,
      });
    }
    for (const job of scopedJobs) {
      const row = bySite.get(job.site);
      if (!row) continue;
      row.plan[job.dutyCycle] = (row.plan[job.dutyCycle] ?? 0) + 1;
      row.planTotal++;
      if (job.status === "Finished") {
        row.actual[job.dutyCycle] = (row.actual[job.dutyCycle] ?? 0) + 1;
        row.actualTotal++;
      }
    }
    const rowList = [...bySite.values()];
    for (const row of rowList) {
      row.pct = row.planTotal === 0 ? 0 : (row.actualTotal / row.planTotal) * 100;
      row.dutyCount = cycles.filter((c) => (row.plan[c] ?? 0) > 0).length;
    }
    const total: SiteBreakdown = {
      site: "Grand Total",
      plan: {},
      actual: {},
      planTotal: 0,
      actualTotal: 0,
      pct: 0,
      dutyCount: 0,
    };
    for (const row of rowList) {
      for (const c of cycles) {
        total.plan[c] = (total.plan[c] ?? 0) + (row.plan[c] ?? 0);
        total.actual[c] = (total.actual[c] ?? 0) + (row.actual[c] ?? 0);
      }
      total.planTotal += row.planTotal;
      total.actualTotal += row.actualTotal;
    }
    total.pct = total.planTotal === 0 ? 0 : (total.actualTotal / total.planTotal) * 100;
    total.dutyCount = cycles.filter((c) => (total.plan[c] ?? 0) > 0).length;
    return { rows: rowList, grand: total };
  }, [scopedJobs, data.sites, cycles]);

  const planInk = dark ? PLAN_ACTUAL_TABLE.plan.ink.dark : PLAN_ACTUAL_TABLE.plan.ink.light;
  const actualInk = dark ? PLAN_ACTUAL_TABLE.actual.ink.dark : PLAN_ACTUAL_TABLE.actual.ink.light;
  const dutyInk = dark ? PLAN_ACTUAL_TABLE.duty.ink.dark : PLAN_ACTUAL_TABLE.duty.ink.light;

  const groupHeader = (bg: string): CSSProperties => ({ backgroundColor: bg, color: "#ffffff" });
  const hairline: CSSProperties = { borderColor: "var(--hairline)" };
  const groupEdge: CSSProperties = { ...hairline, borderLeftWidth: 2 };

  const numCell = (value: number, ink: string, bold = false): ReactNode => (
    <span
      className={`tabular-nums ${bold ? "font-bold" : ""} ${value === 0 ? "opacity-40" : ""}`}
      style={{ color: ink }}
    >
      {value.toLocaleString()}
    </span>
  );

  const bodyRow = (row: SiteBreakdown, isGrand: boolean): ReactNode => {
    const active = !isGrand && filters.site === row.site;
    return (
      <tr
        key={row.site}
        onClick={isGrand ? undefined : () => toggleFilter("site", row.site)}
        aria-selected={active}
        className={`border-b transition-colors ${
          isGrand
            ? "border-t-2 font-bold"
            : "cursor-pointer odd:bg-black/[0.03] hover:bg-black/[0.06] dark:odd:bg-white/[0.03] dark:hover:bg-white/[0.08]"
        } ${active ? "bg-accent/10 dark:bg-accent-dark/15" : ""}`}
        style={hairline}
      >
        <td className="whitespace-nowrap px-3 py-2 text-left font-semibold">{row.site}</td>
        {cycles.map((c) => (
          <td key={`p-${c}`} className="px-2 py-2 text-center">
            {numCell(row.plan[c] ?? 0, planInk)}
          </td>
        ))}
        <td className="px-2 py-2 text-center">{numCell(row.planTotal, planInk, true)}</td>
        {cycles.map((c, i) => (
          <td
            key={`a-${c}`}
            className="px-2 py-2 text-center"
            style={i === 0 ? groupEdge : undefined}
          >
            {numCell(row.actual[c] ?? 0, actualInk)}
          </td>
        ))}
        <td className="px-2 py-2 text-center">{numCell(row.actualTotal, actualInk, true)}</td>
        <td className="px-2 py-2 text-center font-bold tabular-nums" style={groupEdge}>
          <span style={{ color: pctColor(row.pct, dark) }}>{formatPct(row.pct)}</span>
        </td>
        <td className="px-2 py-2 text-center tabular-nums" style={{ ...groupEdge, color: dutyInk }}>
          {row.dutyCount}
        </td>
      </tr>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-xs">
        <thead>
          <tr>
            <th rowSpan={2} className="border-b px-3 py-2 text-left align-bottom" style={hairline}>
              Site
            </th>
            <th
              colSpan={cycles.length + 1}
              className="px-2 py-1.5 text-center text-[11px] font-bold tracking-wide"
              style={groupHeader(PLAN_ACTUAL_TABLE.plan.header)}
            >
              PLAN
            </th>
            <th
              colSpan={cycles.length + 1}
              className="px-2 py-1.5 text-center text-[11px] font-bold tracking-wide"
              style={groupHeader(PLAN_ACTUAL_TABLE.actual.header)}
            >
              ACTUAL
            </th>
            <th
              rowSpan={2}
              className="whitespace-nowrap px-3 py-1.5 text-center text-[11px] font-bold"
              style={groupHeader(PLAN_ACTUAL_TABLE.pct.header)}
            >
              % Finished
            </th>
            <th
              rowSpan={2}
              className="whitespace-nowrap px-3 py-1.5 text-center text-[11px] font-bold"
              style={groupHeader(PLAN_ACTUAL_TABLE.duty.header)}
            >
              Duty Cycle
            </th>
          </tr>
          <tr>
            {cycles.map((c) => (
              <th key={`ph-${c}`} className="border-b px-2 py-1.5 text-center font-semibold" style={{ ...hairline, color: planInk }}>
                {c}
              </th>
            ))}
            <th className="border-b px-2 py-1.5 text-center font-bold" style={{ ...hairline, color: planInk }}>
              Total
            </th>
            {cycles.map((c, i) => (
              <th
                key={`ah-${c}`}
                className="border-b px-2 py-1.5 text-center font-semibold"
                style={i === 0 ? { ...groupEdge, color: actualInk } : { ...hairline, color: actualInk }}
              >
                {c}
              </th>
            ))}
            <th className="border-b px-2 py-1.5 text-center font-bold" style={{ ...hairline, color: actualInk }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => bodyRow(row, false))}
          {bodyRow(grand, true)}
        </tbody>
      </table>
    </div>
  );
}
