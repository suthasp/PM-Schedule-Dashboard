"use client";

import { useMemo, type ReactNode } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import { MONTH_PIVOT_TINTS, SITE_COLORS } from "@/lib/constants";
import type { ScheduleData } from "@/types/schedule";
import { formatNumber } from "@/utils/format";
import { jobMatchesFilters } from "@/utils/transform";

interface CellStat {
  plan: number;
  done: number;
}

const EMPTY: CellStat = { plan: 0, done: 0 };
const hairline = { borderColor: "var(--hairline)" } as const;

/** Sticky-left cells need an opaque surface under their tint so scrolled columns don't show through. */
const stickyLeft = (tint?: string) =>
  ({
    ...hairline,
    backgroundColor: "var(--surface)",
    backgroundImage: tint ? `linear-gradient(${tint}, ${tint})` : undefined,
    boxShadow: "1px 0 0 var(--hairline)",
  }) as const;

function TripleCells({ stat, bold = false }: { stat: CellStat; bold?: boolean }): ReactNode {
  const cls = `border-b px-2 py-1.5 text-center tabular-nums ${bold ? "font-bold" : ""}`;
  return (
    <>
      <td className={`${cls} border-l`} style={{ backgroundColor: MONTH_PIVOT_TINTS.plan, ...hairline }}>
        {formatNumber(stat.plan)}
      </td>
      <td className={cls} style={{ backgroundColor: MONTH_PIVOT_TINTS.done, ...hairline }}>
        {formatNumber(stat.done)}
      </td>
      <td className={cls} style={{ backgroundColor: MONTH_PIVOT_TINTS.remain, ...hairline }}>
        {formatNumber(stat.plan - stat.done)}
      </td>
    </>
  );
}

/**
 * Month × site pivot: per-site Plan / Done / Remain counts for every fiscal
 * month, plus a leading all-site Plan column and a Total row. Clicking a
 * month name or site header toggles the matching global filter.
 */
export function MonthlySitePivot({ data }: { data: ScheduleData }): ReactNode {
  const { filters, toggleFilter } = useFilters();

  // Months are rows and sites are columns — keep both unfiltered so the
  // pivot stays complete; every other filter applies.
  const scopedJobs = useMemo(() => {
    const scope = { ...filters, month: "all" as const, site: "all" as const };
    return data.jobs.filter((j) => jobMatchesFilters(j, scope));
  }, [data.jobs, filters]);

  const { cells, monthPlan, siteTotals, grandPlan } = useMemo(() => {
    const cellMap = new Map<string, CellStat>();
    const monthMap = new Map<string, number>();
    const siteMap = new Map<string, CellStat>();
    let grand = 0;
    for (const j of scopedJobs) {
      const k = `${j.week.month}|${j.site}`;
      const cell = cellMap.get(k) ?? { plan: 0, done: 0 };
      cell.plan++;
      if (j.status === "Finished") cell.done++;
      cellMap.set(k, cell);
      monthMap.set(j.week.month, (monthMap.get(j.week.month) ?? 0) + 1);
      const site = siteMap.get(j.site) ?? { plan: 0, done: 0 };
      site.plan++;
      if (j.status === "Finished") site.done++;
      siteMap.set(j.site, site);
      grand++;
    }
    return { cells: cellMap, monthPlan: monthMap, siteTotals: siteMap, grandPlan: grand };
  }, [scopedJobs]);

  const halfTint = (idx: number): string =>
    idx < 6 ? MONTH_PIVOT_TINTS.monthFirstHalf : MONTH_PIVOT_TINTS.monthSecondHalf;

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-xs"
        style={{ minWidth: `${220 + data.sites.length * 150}px` }}
      >
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="sticky left-0 z-10 border-b px-3 py-1.5 text-left align-bottom"
              style={stickyLeft()}
            >
              Month
            </th>
            <th
              rowSpan={2}
              className="border-b px-3 py-1.5 text-center align-bottom font-bold"
              style={{ backgroundColor: MONTH_PIVOT_TINTS.plan, ...hairline }}
            >
              Plan
            </th>
            {data.sites.map((site, i) => (
              <th
                key={site}
                colSpan={3}
                className="border-l p-0"
                style={{
                  ...hairline,
                  // Same fill as this site's summary card, so the two read as one system.
                  backgroundColor: SITE_COLORS[i % SITE_COLORS.length],
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFilter("site", site)}
                  aria-pressed={filters.site === site}
                  className={`w-full whitespace-nowrap px-2 py-1.5 text-center font-bold text-white transition-opacity ${
                    filters.site !== "all" && filters.site !== site ? "opacity-50" : ""
                  }`}
                >
                  {site}
                </button>
              </th>
            ))}
          </tr>
          <tr>
            {data.sites.map((site) => (
              <TripleHeader key={site} />
            ))}
          </tr>
        </thead>
        <tbody>
          {data.months.map((month, idx) => {
            const active = filters.month === month;
            return (
              <tr
                key={month}
                className={active ? "ring-1 ring-inset ring-accent dark:ring-accent-dark" : ""}
              >
                <td className="sticky left-0 z-10 border-b p-0" style={stickyLeft(halfTint(idx))}>
                  <button
                    type="button"
                    onClick={() => toggleFilter("month", month)}
                    aria-pressed={active}
                    className="w-full whitespace-nowrap px-3 py-1.5 text-left font-semibold hover:underline"
                  >
                    {month}
                  </button>
                </td>
                <td
                  className="border-b px-3 py-1.5 text-center font-semibold tabular-nums"
                  style={{ backgroundColor: MONTH_PIVOT_TINTS.plan, ...hairline }}
                >
                  {formatNumber(monthPlan.get(month) ?? 0)}
                </td>
                {data.sites.map((site) => (
                  <TripleCells key={site} stat={cells.get(`${month}|${site}`) ?? EMPTY} />
                ))}
              </tr>
            );
          })}
          <tr className="font-bold">
            <td className="sticky left-0 z-10 border-t-2 px-3 py-1.5" style={stickyLeft()}>
              Total
            </td>
            <td
              className="border-t-2 px-3 py-1.5 text-center tabular-nums"
              style={{ backgroundColor: MONTH_PIVOT_TINTS.plan, ...hairline }}
            >
              {formatNumber(grandPlan)}
            </td>
            {data.sites.map((site) => (
              <TripleCells key={site} stat={siteTotals.get(site) ?? EMPTY} bold />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function TripleHeader(): ReactNode {
  return (
    <>
      <th
        className="border-b border-l px-2 py-1 text-center font-semibold"
        style={{ backgroundColor: MONTH_PIVOT_TINTS.plan, ...hairline }}
      >
        Plan
      </th>
      <th
        className="border-b px-2 py-1 text-center font-semibold"
        style={{ backgroundColor: MONTH_PIVOT_TINTS.done, ...hairline }}
      >
        Done
      </th>
      <th
        className="border-b px-2 py-1 text-center font-semibold"
        style={{ backgroundColor: MONTH_PIVOT_TINTS.remain, ...hairline }}
      >
        Remain
      </th>
    </>
  );
}
