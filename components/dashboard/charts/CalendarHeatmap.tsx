"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import { useChartTheme } from "@/hooks/useChartTheme";
import { SEQUENTIAL_BLUE } from "@/lib/constants";
import type { PMJob, ScheduleData, WeekInfo } from "@/types/schedule";
import { formatNumber } from "@/utils/format";

interface CellDatum {
  week: WeekInfo;
  count: number;
  completed: number;
}

/**
 * Fiscal-year calendar heatmap: one cell per week, sequential-blue by job
 * count. Clicking a cell toggles the month filter for that week's month.
 */
export function CalendarHeatmap({
  jobs,
  data,
}: {
  jobs: PMJob[];
  data: ScheduleData;
}): ReactNode {
  const theme = useChartTheme();
  const { filters, toggleFilter } = useFilters();
  const [hovered, setHovered] = useState<CellDatum | null>(null);

  const cells = useMemo<CellDatum[]>(() => {
    const counts = new Map<number, { count: number; completed: number }>();
    for (const j of jobs) {
      const entry = counts.get(j.week.index) ?? { count: 0, completed: 0 };
      entry.count++;
      if (j.status === "Completed") entry.completed++;
      counts.set(j.week.index, entry);
    }
    return data.weeks.map((week) => ({
      week,
      count: counts.get(week.index)?.count ?? 0,
      completed: counts.get(week.index)?.completed ?? 0,
    }));
  }, [jobs, data.weeks]);

  const max = Math.max(1, ...cells.map((c) => c.count));

  const colorFor = (count: number): string => {
    if (count === 0) return theme.dark ? "#242423" : "#f0efec";
    const idx = Math.min(
      SEQUENTIAL_BLUE.length - 1,
      Math.floor((count / max) * SEQUENTIAL_BLUE.length),
    );
    return SEQUENTIAL_BLUE[idx] ?? SEQUENTIAL_BLUE[0];
  };

  // Group consecutive weeks by month for the label row.
  const monthGroups = useMemo(() => {
    const groups: { month: string; span: number }[] = [];
    for (const c of cells) {
      const last = groups[groups.length - 1];
      if (last && last.month === c.week.month) last.span++;
      else groups.push({ month: c.week.month, span: 1 });
    }
    return groups;
  }, [cells]);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[720px]">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
          >
            {cells.map((c) => (
              <button
                key={c.week.label}
                type="button"
                aria-label={`${c.week.label} (${c.week.month} ${c.week.year}): ${c.count} jobs`}
                onClick={() => toggleFilter("month", c.week.month)}
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
                className={`h-9 rounded-md transition-transform hover:scale-110 ${
                  filters.month !== "all" && filters.month !== c.week.month ? "opacity-35" : ""
                }`}
                style={{ backgroundColor: colorFor(c.count) }}
              />
            ))}
          </div>
          <div
            className="mt-1 grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
          >
            {monthGroups.map((g, i) => (
              <span
                key={`${g.month}-${i}`}
                className="text-muted truncate text-[10px]"
                style={{ gridColumn: `span ${g.span}` }}
              >
                {g.month.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-secondary min-h-[1rem]" aria-live="polite">
          {hovered
            ? `${hovered.week.label} · ${hovered.week.month} ${hovered.week.year} — ${formatNumber(
                hovered.count,
              )} jobs, ${formatNumber(hovered.completed)} completed`
            : "Hover a week for details · click to filter by month"}
        </span>
        <span className="text-muted flex items-center gap-1">
          0
          {SEQUENTIAL_BLUE.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          {formatNumber(max)}
        </span>
      </div>
    </div>
  );
}
