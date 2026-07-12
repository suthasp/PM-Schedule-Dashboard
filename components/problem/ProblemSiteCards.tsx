"use client";

import { motion } from "framer-motion";
import { useMemo, type ReactNode } from "react";
import type { ProblemFilters } from "@/components/problem/ProblemFilterBar";
import { PROBLEM_SUMMARY, SITE_COLORS } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { formatNumber, formatPercent } from "@/utils/format";
import { resolveProblemFields } from "@/utils/problemTransform";

interface SiteCard {
  site: string;
  open: number;
  closed: number;
  total: number;
  pct: number;
}

/**
 * Per-site problem cards: OPEN (in progress) / CLOSED (finished) / % solved
 * with a progress bar. Clicking a card toggles the page's site filter. The
 * other filters apply, but not the site itself, so cards stay comparable.
 */
export function ProblemSiteCards({
  data,
  filters,
  onToggleSite,
}: {
  data: ProblemData;
  filters: ProblemFilters;
  onToggleSite: (site: string) => void;
}): ReactNode {
  const cards = useMemo<SiteCard[]>(() => {
    const fields = resolveProblemFields(data);
    if (!fields.site) return [];
    const bySite = new Map<string, SiteCard>();
    for (const row of data.rows) {
      const scope = fields.scope ? (row.values[fields.scope] ?? "").trim() : "";
      const status = fields.workStatus ? (row.values[fields.workStatus] ?? "").trim() : "";
      if (filters.scope !== "all" && scope !== filters.scope) continue;
      if (filters.status !== "all" && status !== filters.status) continue;
      const site = (row.values[fields.site] ?? "").trim();
      if (!site) continue;
      const card = bySite.get(site) ?? { site, open: 0, closed: 0, total: 0, pct: 0 };
      card.total++;
      if (/^finish/i.test(status)) card.closed++;
      else card.open++;
      bySite.set(site, card);
    }
    return [...bySite.values()]
      .map((c) => ({ ...c, pct: c.total === 0 ? 0 : (c.closed / c.total) * 100 }))
      .sort((a, b) => a.site.localeCompare(b.site));
  }, [data, filters.scope, filters.status]);

  if (cards.length === 0) return null;

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
    >
      {cards.map((c, i) => {
        const color = SITE_COLORS[i % SITE_COLORS.length] ?? SITE_COLORS[0];
        const active = filters.site === c.site;
        return (
          <motion.button
            key={c.site}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.02 }}
            onClick={() => onToggleSite(c.site)}
            aria-pressed={active}
            className={`card overflow-hidden text-left transition-shadow hover:shadow-soft-lg ${
              active ? "ring-2 ring-accent dark:ring-accent-dark" : ""
            }`}
          >
            <div className="border-l-4 px-2.5 pb-1 pt-2 leading-tight" style={{ borderColor: color }}>
              <p className="truncate text-[12px] font-bold" style={{ color }}>
                {c.site}
              </p>
              <p className="text-muted text-[10px]">Problem Solving</p>
            </div>
            <div className="grid grid-cols-3 gap-1 px-2.5 py-1.5 text-center text-[11px]">
              <div>
                <p className="text-muted text-[9px] font-medium tracking-wide">OPEN</p>
                <p className="font-bold tabular-nums" style={{ color: PROBLEM_SUMMARY.inProgress.bg }}>
                  {formatNumber(c.open)}
                </p>
              </div>
              <div>
                <p className="text-muted text-[9px] font-medium tracking-wide">CLOSED</p>
                <p className="font-bold tabular-nums" style={{ color: PROBLEM_SUMMARY.finished.bg }}>
                  {formatNumber(c.closed)}
                </p>
              </div>
              <div>
                <p className="text-muted text-[9px] font-medium tracking-wide">%</p>
                <p className="font-bold tabular-nums" style={{ color }}>
                  {formatPercent(c.pct, 0)}
                </p>
              </div>
            </div>
            <div className="px-2.5 pb-2">
              <div
                className="h-1.5 overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--gridline)" }}
                role="progressbar"
                aria-valuenow={Math.round(c.pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${c.site} solved ${formatPercent(c.pct, 0)}`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${c.pct}%`, backgroundColor: color }}
                />
              </div>
              <p className="mt-1 flex items-baseline justify-between text-[11px]">
                <span className="text-muted">Remain</span>
                <span className="font-bold tabular-nums" style={{ color: PROBLEM_SUMMARY.inProgress.bg }}>
                  {formatNumber(c.open)}
                </span>
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
