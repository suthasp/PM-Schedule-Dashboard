"use client";

import { useMemo, type ReactNode } from "react";
import { useChartTheme } from "@/hooks/useChartTheme";
import { BUDGET_STATUS_CHIPS, CRITERIA_CHIPS, PROBLEM_SUMMARY } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";

/** Report columns, resolved by label so new sheet columns don't break this. */
interface ReportFields {
  no: string | null;
  site: string | null;
  recordDate: string | null;
  subCause: string | null;
  criteria: string | null;
  scope: string | null;
  description: string | null;
  planDate: string | null;
  workStatus: string | null;
  boqAmount: string | null;
  referenceCode: string | null;
  budgetStatus: string | null;
  remark: string | null;
}

function resolveReportFields(data: ProblemData): ReportFields {
  const find = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const hit = data.columns.find((c) => pattern.test(c.label));
      if (hit) return hit.header;
    }
    return null;
  };
  return {
    no: find([/^no\.?$/i]),
    site: find([/^cn\s*site$/i, /site/i]),
    recordDate: find([/วันที่ลงบันทึก/]),
    subCause: find([/^sub\s*cause/i]),
    criteria: find([/^criteria/i]),
    scope: find([/scope/i]),
    description: find([/^description/i]),
    planDate: find([/^plan\s*date$/i]),
    workStatus: find([/^work\s*status$/i]),
    boqAmount: find([/^boq\s*amount/i]),
    referenceCode: find([/^record\s*reference/i]),
    budgetStatus: find([/^status\s*budget/i]),
    remark: find([/^remark$/i]),
  };
}

/** Scope grouping order used by the report; anything unknown sorts last. */
const SCOPE_ORDER = ["In(AMC)", "In(R)", "In", "Out"];

function scopeRank(scope: string): number {
  const i = SCOPE_ORDER.indexOf(scope);
  return i === -1 ? SCOPE_ORDER.length : i;
}

/** "93894.09" / "93,894.09" → "93,894.09"; blank or non-numeric passes through. */
function formatBaht(raw: string): string {
  const n = Number(raw.replace(/,/g, "").trim());
  if (raw.trim() === "" || Number.isNaN(n)) return raw;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "3/12/2024" → "03/12/2024"; anything else passes through unchanged. */
function padDmy(raw: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) return raw;
  return `${(m[1] ?? "").padStart(2, "0")}/${(m[2] ?? "").padStart(2, "0")}/${m[3]}`;
}

function BudgetStatus({ value }: { value: string }): ReactNode {
  if (value === "") return null;
  const chip = BUDGET_STATUS_CHIPS.find((c) => c.pattern.test(value));
  if (!chip) return value;
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4"
      style={{ backgroundColor: chip.bg, color: chip.fg }}
    >
      {value}
    </span>
  );
}

interface ReportRow {
  id: string;
  no: string;
  site: string;
  recordDate: string;
  subCause: string;
  criteria: string;
  scope: string;
  description: string;
  planDate: string;
  workStatus: string;
  boqAmount: string;
  referenceCode: string;
  budgetStatus: string;
  remark: string;
}

/**
 * Executive action list: every problem still in progress, grouped by
 * In/Out Scope then by record number — mirroring the printed report.
 */
export function ProblemInProgressTable({ data }: { data: ProblemData }): ReactNode {
  const { dark } = useChartTheme();
  const mode = dark ? "dark" : "light";

  const rows = useMemo<ReportRow[]>(() => {
    const f = resolveReportFields(data);
    if (!f.workStatus) return [];
    const get = (values: Record<string, string>, header: string | null): string =>
      header === null ? "" : (values[header] ?? "").trim();

    return data.rows
      .filter((r) => /in\s*progress/i.test(get(r.values, f.workStatus)))
      .map((r) => ({
        id: r.id,
        no: get(r.values, f.no),
        site: get(r.values, f.site),
        recordDate: padDmy(get(r.values, f.recordDate)),
        subCause: get(r.values, f.subCause),
        criteria: get(r.values, f.criteria),
        scope: get(r.values, f.scope),
        description: get(r.values, f.description),
        planDate: padDmy(get(r.values, f.planDate)),
        workStatus: get(r.values, f.workStatus),
        boqAmount: formatBaht(get(r.values, f.boqAmount)),
        referenceCode: get(r.values, f.referenceCode),
        budgetStatus: get(r.values, f.budgetStatus),
        remark: get(r.values, f.remark),
      }))
      .sort(
        (a, b) =>
          scopeRank(a.scope) - scopeRank(b.scope) ||
          a.scope.localeCompare(b.scope) ||
          (Number(a.no) || 0) - (Number(b.no) || 0),
      );
  }, [data]);

  const scopeStyle = (scope: string): { backgroundColor: string; color: string } | undefined => {
    const key = /^in\s*\(\s*amc/i.test(scope)
      ? "scopeAmc"
      : /^in\s*\(\s*r/i.test(scope)
        ? "scopeR"
        : /^in$/i.test(scope)
          ? "scopeIn"
          : /^out/i.test(scope)
            ? "scopeOut"
            : null;
    if (!key) return undefined;
    const tone = PROBLEM_SUMMARY[key];
    return { backgroundColor: tone.bg[mode], color: tone.ink[mode] };
  };

  if (rows.length === 0) {
    return (
      <p className="text-muted py-8 text-center text-sm">
        No in-progress problems match the current filters.
      </p>
    );
  }

  const hairline = { borderColor: "var(--hairline)" } as const;
  const headerCell = "whitespace-nowrap px-2 py-2 text-center text-xs font-bold";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1500px] border-collapse text-xs">
        <thead>
          <tr
            style={{
              backgroundColor: PROBLEM_SUMMARY.reportHeader.bg,
              color: PROBLEM_SUMMARY.reportHeader.fg,
            }}
          >
            <th className={headerCell}>No.</th>
            <th className={headerCell}>CN Site</th>
            <th className={headerCell}>วันที่ลงบันทึก</th>
            <th className={headerCell}>Sub Cause</th>
            <th className={headerCell}>Criteria</th>
            <th className={headerCell}>In/Out Scope</th>
            <th className={headerCell}>Description รายละเอียดของปัญหาที่พบ</th>
            <th className={headerCell}>Plan Date</th>
            <th className={headerCell}>Work Status</th>
            <th className={headerCell}>BOQ Amount (Baht)</th>
            <th className={headerCell}>Record Reference Code</th>
            <th className={headerCell}>Status Budget</th>
            <th className={headerCell}>Remark</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b align-top odd:bg-black/[0.03] dark:odd:bg-white/[0.03]"
              style={hairline}
            >
              <td className="px-2 py-1.5 text-center tabular-nums">{row.no}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-center">{row.site}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-center tabular-nums">
                {row.recordDate}
              </td>
              <td className="px-2 py-1.5">{row.subCause}</td>
              <td
                className="px-2 py-1.5 text-center font-bold"
                style={{ color: CRITERIA_CHIPS[row.criteria.toUpperCase()]?.bg }}
              >
                {row.criteria}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-center font-semibold" style={scopeStyle(row.scope)}>
                {row.scope}
              </td>
              <td className="min-w-[260px] px-2 py-1.5">{row.description}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-center tabular-nums">{row.planDate}</td>
              <td
                className="whitespace-nowrap px-2 py-1.5 text-center font-semibold"
                style={{ color: PROBLEM_SUMMARY.inProgress.bg }}
              >
                {row.workStatus}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">{row.boqAmount}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-center">{row.referenceCode}</td>
              <td className="whitespace-nowrap px-2 py-1.5 text-center">
                <BudgetStatus value={row.budgetStatus} />
              </td>
              <td className="min-w-[260px] px-2 py-1.5">{row.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
