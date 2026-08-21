"use client";

import { Fragment, useMemo, type CSSProperties, type ReactNode } from "react";
import { useChartTheme } from "@/hooks/useChartTheme";
import { PROBLEM_SUMMARY } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { formatNumber } from "@/utils/format";
import { resolveProblemFields } from "@/utils/problemTransform";

/** Row grouping order; anything unrecognised sorts last. */
const SCOPE_ORDER = ["In", "In(AMC)", "In(R)", "Out"];
const STATUS_ORDER = ["In progress", "Finished"];
const CRITERIA_ORDER = ["CRITICAL", "MAJOR", "MINOR"];

function rank(order: string[], value: string): number {
  const i = order.findIndex((o) => o.toLowerCase() === value.toLowerCase());
  return i === -1 ? order.length : i;
}

/** Canonicalise a status cell to one of STATUS_ORDER (blank counts as In progress). */
function normalizeStatus(raw: string): string {
  return /^finish/i.test(raw) ? "Finished" : "In progress";
}

interface LeafRow {
  status: string;
  criteria: string;
  counts: number[];
  total: number;
}

interface ScopeGroup {
  scope: string;
  /** Leaves in render order, already grouped by status. */
  leaves: LeafRow[];
  /** Row count of each status block, parallel to the order leaves appear in. */
  blocks: { status: string; span: number }[];
  counts: number[];
  total: number;
}

interface Pivot {
  sites: string[];
  groups: ScopeGroup[];
  counts: number[];
  total: number;
}

function buildPivot(data: ProblemData): Pivot {
  const f = resolveProblemFields(data);
  const criteriaHeader = data.columns.find((c) => /^criteria/i.test(c.label))?.header ?? null;
  const get = (values: Record<string, string>, header: string | null): string =>
    header === null ? "" : (values[header] ?? "").trim();

  const sites = [
    ...new Set(data.rows.map((r) => get(r.values, f.site)).filter((s) => s !== "")),
  ].sort((a, b) => a.localeCompare(b));
  const siteIndex = new Map(sites.map((s, i) => [s, i]));

  // scope -> status -> criteria -> per-site counts
  const byScope = new Map<string, Map<string, Map<string, number[]>>>();
  const scopeCounts = new Map<string, number[]>();
  const grand = new Array(sites.length).fill(0) as number[];

  for (const row of data.rows) {
    const scope = get(row.values, f.scope) || "—";
    const status = normalizeStatus(get(row.values, f.workStatus));
    const criteria = get(row.values, criteriaHeader) || "—";
    const idx = siteIndex.get(get(row.values, f.site));
    if (idx === undefined) continue;

    const byStatus = byScope.get(scope) ?? new Map<string, Map<string, number[]>>();
    const byCriteria = byStatus.get(status) ?? new Map<string, number[]>();
    const counts = byCriteria.get(criteria) ?? (new Array(sites.length).fill(0) as number[]);
    counts[idx] = (counts[idx] ?? 0) + 1;
    byCriteria.set(criteria, counts);
    byStatus.set(status, byCriteria);
    byScope.set(scope, byStatus);

    const sc = scopeCounts.get(scope) ?? (new Array(sites.length).fill(0) as number[]);
    sc[idx] = (sc[idx] ?? 0) + 1;
    scopeCounts.set(scope, sc);

    grand[idx] = (grand[idx] ?? 0) + 1;
  }

  const sum = (counts: number[]): number => counts.reduce((a, c) => a + c, 0);

  const groups: ScopeGroup[] = [...byScope.entries()]
    .sort(([a], [b]) => rank(SCOPE_ORDER, a) - rank(SCOPE_ORDER, b) || a.localeCompare(b))
    .map(([scope, byStatus]) => {
      const leaves: LeafRow[] = [];
      const blocks: { status: string; span: number }[] = [];
      const statuses = [...byStatus.entries()].sort(
        ([a], [b]) => rank(STATUS_ORDER, a) - rank(STATUS_ORDER, b) || a.localeCompare(b),
      );
      for (const [status, byCriteria] of statuses) {
        const criteriaRows = [...byCriteria.entries()].sort(
          ([a], [b]) => rank(CRITERIA_ORDER, a) - rank(CRITERIA_ORDER, b) || a.localeCompare(b),
        );
        blocks.push({ status, span: criteriaRows.length });
        for (const [criteria, counts] of criteriaRows) {
          leaves.push({ status, criteria, counts, total: sum(counts) });
        }
      }
      const counts = scopeCounts.get(scope) ?? (new Array(sites.length).fill(0) as number[]);
      return { scope, leaves, blocks, counts, total: sum(counts) };
    });

  return { sites, groups, counts: grand, total: sum(grand) };
}

const hairline = { borderColor: "var(--hairline)" } as const;

/**
 * In/Out Scope × Work Status × Criteria pivot, one column per site.
 * Zero cells render blank so the populated ones stand out, as in the report.
 */
export function ProblemScopePivot({ data }: { data: ProblemData }): ReactNode {
  const { dark } = useChartTheme();
  const mode = dark ? "dark" : "light";
  const p = useMemo(() => buildPivot(data), [data]);

  if (p.groups.length === 0) {
    return <p className="text-muted py-8 text-center text-sm">No problems match the current filters.</p>;
  }

  const scopeTone = (scope: string): { bg: string; ink: string } | null => {
    const key = /^in\s*\(\s*amc/i.test(scope)
      ? "scopeAmc"
      : /^in\s*\(\s*r/i.test(scope)
        ? "scopeR"
        : /^in$/i.test(scope)
          ? "scopeIn"
          : /^out/i.test(scope)
            ? "scopeOut"
            : null;
    if (!key) return null;
    const tone = PROBLEM_SUMMARY[key];
    return { bg: tone.bg[mode], ink: tone.ink[mode] };
  };

  const statusFill = (status: string): CSSProperties => ({
    backgroundColor:
      status === "Finished"
        ? PROBLEM_SUMMARY.statusRow.finished[mode]
        : PROBLEM_SUMMARY.statusRow.inProgress[mode],
  });

  const statusInk = (status: string): string =>
    status === "Finished" ? PROBLEM_SUMMARY.finished.bg : PROBLEM_SUMMARY.inProgress.bg;

  const headerCell = "whitespace-nowrap border px-2 py-1.5 text-xs font-bold";
  const cell = "border px-2 py-1 text-center tabular-nums";
  const num = (n: number): string => (n === 0 ? "" : formatNumber(n));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr
            style={{
              backgroundColor: PROBLEM_SUMMARY.reportHeader.bg,
              color: PROBLEM_SUMMARY.reportHeader.fg,
              ...hairline,
            }}
          >
            <th className={`${headerCell} text-left`} style={hairline}>
              In/Out Scope
            </th>
            <th className={`${headerCell} text-left`} style={hairline}>
              Status
            </th>
            <th className={`${headerCell} text-left`} style={hairline}>
              Criteria
            </th>
            {p.sites.map((s) => (
              <th key={s} className={`${headerCell} text-center`} style={hairline}>
                {s}
              </th>
            ))}
            <th className={`${headerCell} text-center`} style={hairline}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {p.groups.map((g) => {
            const tone = scopeTone(g.scope);
            const scopeStyle = tone
              ? { ...hairline, backgroundColor: tone.bg, color: tone.ink }
              : hairline;
            // Track which leaf index starts each status block, for the rowSpan.
            let leafCursor = 0;
            const blockStart = new Map<number, { status: string; span: number }>();
            for (const b of g.blocks) {
              blockStart.set(leafCursor, b);
              leafCursor += b.span;
            }

            return (
              <Fragment key={g.scope}>
                {g.leaves.map((leaf, i) => {
                  const block = blockStart.get(i);
                  return (
                    <tr key={`${g.scope}-${leaf.status}-${leaf.criteria}`} style={statusFill(leaf.status)}>
                      {i === 0 && (
                        <td
                          rowSpan={g.leaves.length + 1}
                          className="whitespace-nowrap border px-2 py-1 align-top font-bold"
                          style={scopeStyle}
                        >
                          {g.scope}
                        </td>
                      )}
                      {block && (
                        <td
                          rowSpan={block.span}
                          className="whitespace-nowrap border px-2 py-1 align-top font-semibold"
                          style={{ ...hairline, color: statusInk(leaf.status) }}
                        >
                          {leaf.status}
                        </td>
                      )}
                      <td className="whitespace-nowrap border px-2 py-1" style={hairline}>
                        {leaf.criteria}
                      </td>
                      {leaf.counts.map((c, ci) => (
                        <td key={p.sites[ci]} className={cell} style={hairline}>
                          {num(c)}
                        </td>
                      ))}
                      <td className={`${cell} font-bold`} style={hairline}>
                        {num(leaf.total)}
                      </td>
                    </tr>
                  );
                })}
                <tr style={scopeStyle}>
                  <td className="border px-2 py-1 font-bold" colSpan={2} style={scopeStyle}>
                    Total
                  </td>
                  {g.counts.map((c, ci) => (
                    <td key={p.sites[ci]} className={`${cell} font-bold`} style={scopeStyle}>
                      {num(c)}
                    </td>
                  ))}
                  <td className={`${cell} font-bold`} style={scopeStyle}>
                    {num(g.total)}
                  </td>
                </tr>
              </Fragment>
            );
          })}
          <tr
            style={{
              backgroundColor: PROBLEM_SUMMARY.reportHeader.bg,
              color: PROBLEM_SUMMARY.reportHeader.fg,
            }}
          >
            <td className="border px-2 py-1.5 font-bold" colSpan={3} style={hairline}>
              Total
            </td>
            {p.counts.map((c, ci) => (
              <td key={p.sites[ci]} className={`${cell} font-bold`} style={hairline}>
                {num(c)}
              </td>
            ))}
            <td className={`${cell} font-bold`} style={hairline}>
              {num(p.total)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
