"use client";

import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import type { PMJob, ScheduleData } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";
import { jobMatchesFilters } from "@/utils/transform";

interface SiteSummary {
  site: string;
  total: number;
  finished: number;
  remain: number;
  pct: number;
}

/** Header colors (700-ish shades so white text stays readable). */
const SITE_COLORS = [
  "#1d4ed8",
  "#0e7490",
  "#7c3aed",
  "#15803d",
  "#b91c1c",
  "#a16207",
  "#be123c",
  "#047857",
  "#1e40af",
  "#6d28d9",
] as const;

function barColor(pct: number): string {
  if (pct >= 80) return "#0ca30c";
  if (pct >= 50) return "#fab219";
  return "#d03b3b";
}

function summarizeSite(jobs: PMJob[], site: string | null): Omit<SiteSummary, "site"> {
  let total = 0;
  let finished = 0;
  for (const j of jobs) {
    if (site !== null && j.site !== site) continue;
    total++;
    if (j.status === "Finished") finished++;
  }
  return {
    total,
    finished,
    remain: total - finished,
    pct: total === 0 ? 0 : (finished / total) * 100,
  };
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}): ReactNode {
  return (
    <p className="flex items-baseline justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="font-bold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </span>
    </p>
  );
}

/**
 * Per-site summary strip: ALL SITES first, then one card per site.
 * Clicking a card toggles the global site filter for the whole app.
 */
export function SiteSummaryRow({ data }: { data: ScheduleData }): ReactNode {
  const { filters, toggleFilter } = useFilters();

  // Respect every filter except the site itself, so all cards stay comparable.
  const scopedJobs = useMemo(() => {
    const scope = { ...filters, site: "all" as const };
    return data.jobs.filter((j) => jobMatchesFilters(j, scope));
  }, [data.jobs, filters]);

  const cards = useMemo<SiteSummary[]>(
    () => data.sites.map((site) => ({ site, ...summarizeSite(scopedJobs, site) })),
    [scopedJobs, data.sites],
  );

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))" }}
    >
      {cards.map((c, i) => {
        const headerColor = SITE_COLORS[i % SITE_COLORS.length] ?? "#1d4ed8";
        const active = filters.site === c.site;
        return (
          <motion.button
            key={c.site}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.02 }}
            onClick={() => toggleFilter("site", c.site)}
            aria-pressed={active}
            className={`card overflow-hidden text-left transition-shadow hover:shadow-soft-lg ${
              active ? "ring-2 ring-accent dark:ring-accent-dark" : ""
            }`}
          >
            <div
              className="truncate px-2.5 py-1.5 text-[11px] font-bold text-white"
              style={{ backgroundColor: headerColor }}
            >
              {c.site}
            </div>
            <div className="space-y-1 px-2.5 py-2 text-[11px]">
              <StatRow label="%Finished" value={formatPercent(c.pct)} color="#0ca30c" />
              <StatRow label="Finished" value={formatNumber(c.finished)} color="#0ca30c" />
              <StatRow label="Remain" value={formatNumber(c.remain)} color="#d03b3b" />
              <StatRow label="Total" value={formatNumber(c.total)} />
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--gridline)" }}
                role="progressbar"
                aria-valuenow={Math.round(c.pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${c.site} finished ${formatPercent(c.pct)}`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${c.pct}%`, backgroundColor: barColor(c.pct) }}
                />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
