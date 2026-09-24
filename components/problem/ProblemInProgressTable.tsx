"use client";

import { Download, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useChartTheme } from "@/hooks/useChartTheme";
import {
  BUDGET_STATUS_CHIPS,
  CRITERIA_CHIPS,
  PROBLEM_SUMMARY,
  RISK_LEVEL_CHIPS,
} from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { exportInProgressXlsx, type InProgressExportRow } from "@/utils/exportInProgressXlsx";

/** Report columns, resolved by label so new sheet columns don't break this. */
interface ReportFields {
  no: string | null;
  site: string | null;
  recordDate: string | null;
  subCause: string | null;
  criteria: string | null;
  scope: string | null;
  sla: string | null;
  description: string | null;
  planDate: string | null;
  workStatus: string | null;
  boqAmount: string | null;
  referenceCode: string | null;
  budgetStatus: string | null;
  riskLevel: string | null;
  riskImpact: string | null;
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
    sla: find([/^sla\s*\(/i, /^sla/i]),
    description: find([/^description/i]),
    planDate: find([/^plan\s*date$/i]),
    workStatus: find([/^work\s*status$/i]),
    boqAmount: find([/^boq\s*amount/i]),
    referenceCode: find([/^record\s*reference/i]),
    budgetStatus: find([/^status\s*budget/i]),
    riskLevel: find([/^risk\s*level/i]),
    riskImpact: find([/^risk\s*impact/i]),
    remark: find([/^remark$/i]),
  };
}

/** Scope grouping order used by the report; anything unknown sorts last. */
const SCOPE_ORDER = ["In(AMC)", "In(R)", "In", "Out"];

function scopeRank(scope: string): number {
  const i = SCOPE_ORDER.indexOf(scope);
  return i === -1 ? SCOPE_ORDER.length : i;
}

/** "93,894.09" → 93894.09; blank or non-numeric → null. */
function parseBaht(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isNaN(n) ? null : n;
}

/** 93894.09 → "93,894.09"; null stays blank. */
function formatBaht(value: number | null): string {
  return value === null
    ? ""
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "3/12/2024" → "03/12/2024"; anything else passes through unchanged. */
function padDmy(raw: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) return raw;
  return `${(m[1] ?? "").padStart(2, "0")}/${(m[2] ?? "").padStart(2, "0")}/${m[3]}`;
}

/**
 * Column headers and their pixel widths. Every column is sized for its own
 * content rather than squeezed into the card, so the prose columns stay
 * readable; the table scrolls sideways when the total exceeds the card.
 */
const COLUMNS: { label: string; width: number }[] = [
  { label: "No.", width: 40 },
  { label: "CN Site", width: 84 },
  { label: "วันที่ลงบันทึก", width: 82 },
  { label: "Sub Cause", width: 150 },
  { label: "Criteria", width: 62 },
  { label: "In/Out Scope", width: 74 },
  { label: "SLA (Day)", width: 58 },
  { label: "Description รายละเอียดของปัญหาที่พบ", width: 250 },
  { label: "Plan Date", width: 82 },
  { label: "Work Status", width: 80 },
  { label: "BOQ Amount (Baht)", width: 96 },
  { label: "Record Reference Code", width: 104 },
  { label: "Status Budget", width: 124 },
  { label: "Risk Level", width: 78 },
  { label: "Risk Impact", width: 230 },
  { label: "Remark", width: 210 },
];

const TABLE_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0);

/** One line; overflow ends in "…", and hovering shows the whole value. */
function Fit({ text }: { text: string }): ReactNode {
  if (text === "") return null;
  return (
    <div className="truncate" title={text}>
      {text}
    </div>
  );
}

/** Wraps to two lines, then "…"; hovering shows the whole text. */
function Clamp({ text }: { text: string }): ReactNode {
  if (text === "") return null;
  return (
    <div className="line-clamp-2 break-words" title={text}>
      {text}
    </div>
  );
}

function BudgetStatus({ value }: { value: string }): ReactNode {
  if (value === "") return null;
  const chip = BUDGET_STATUS_CHIPS.find((c) => c.pattern.test(value));
  if (!chip) return <Fit text={value} />;
  return (
    <span
      className="inline-block max-w-full truncate rounded-full px-2 py-0.5 align-top text-[10.5px] font-semibold leading-4"
      style={{ backgroundColor: chip.bg, color: chip.fg }}
      title={value}
    >
      {value}
    </span>
  );
}

function RiskLevel({ value }: { value: string }): ReactNode {
  if (value === "") return null;
  const chip = RISK_LEVEL_CHIPS[value.trim().toUpperCase()];
  if (!chip) return <Fit text={value} />;
  return (
    <span
      className="inline-block max-w-full truncate rounded px-1.5 py-0.5 align-top text-[10.5px] font-semibold leading-4"
      style={{ backgroundColor: chip.bg, color: chip.fg }}
      title={value}
    >
      {value}
    </span>
  );
}

interface ReportRow extends InProgressExportRow {
  id: string;
  /** boqValue formatted for display. */
  boqAmount: string;
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
        sla: get(r.values, f.sla),
        description: get(r.values, f.description),
        planDate: padDmy(get(r.values, f.planDate)),
        workStatus: get(r.values, f.workStatus),
        boqValue: parseBaht(get(r.values, f.boqAmount)),
        boqAmount: formatBaht(parseBaht(get(r.values, f.boqAmount))),
        referenceCode: get(r.values, f.referenceCode),
        budgetStatus: get(r.values, f.budgetStatus),
        riskLevel: get(r.values, f.riskLevel),
        riskImpact: get(r.values, f.riskImpact),
        remark: get(r.values, f.remark),
      }))
      .sort(
        (a, b) =>
          scopeRank(a.scope) - scopeRank(b.scope) ||
          a.scope.localeCompare(b.scope) ||
          (Number(a.no) || 0) - (Number(b.no) || 0),
      );
  }, [data]);

  const [exporting, setExporting] = useState(false);
  const exportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const today = new Date();
      const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate(),
      ).padStart(2, "0")}`;
      await exportInProgressXlsx(rows, `in-progress-problems-${stamp}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [rows]);

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
  const headerCell = "px-1.5 py-2 text-center text-[11px] font-bold leading-tight";
  const cell = "px-1.5 py-1.5";

  return (
    <div className="space-y-2">
      <div className="no-print flex items-center justify-between gap-2">
        <p className="text-secondary text-sm">
          {rows.length.toLocaleString()} in-progress problems
        </p>
        <button
          type="button"
          onClick={() => void exportExcel()}
          disabled={exporting}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-accent-dark"
        >
          {exporting ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <Download size={15} aria-hidden />
          )}
          Export Excel
        </button>
      </div>
      {/* Both axes scroll inside the card: sideways for the full column set,
          down for the row list, with the header pinned either way. */}
      <div
        className="max-h-[72vh] overflow-auto rounded-card border"
        style={hairline}
        tabIndex={0}
        role="region"
        aria-label="In Progress Problems table"
      >
        <table
          className="table-fixed border-collapse text-[11px]"
          style={{ width: TABLE_WIDTH, minWidth: "100%" }}
        >
          <colgroup>
            {COLUMNS.map((c) => (
              <col key={c.label} style={{ width: c.width }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr
              style={{
                backgroundColor: PROBLEM_SUMMARY.reportHeader.bg,
                color: PROBLEM_SUMMARY.reportHeader.fg,
              }}
            >
              {COLUMNS.map((c) => (
                <th key={c.label} className={headerCell}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b align-top odd:bg-black/[0.03] dark:odd:bg-white/[0.03]"
              style={hairline}
            >
              <td className={`${cell} text-center tabular-nums`}>
                <Fit text={row.no} />
              </td>
              <td className={`${cell} text-center`}>
                <Fit text={row.site} />
              </td>
              <td className={`${cell} text-center tabular-nums`}>
                <Fit text={row.recordDate} />
              </td>
              <td className={cell}>
                <Clamp text={row.subCause} />
              </td>
              <td
                className={`${cell} text-center font-bold`}
                style={{ color: CRITERIA_CHIPS[row.criteria.toUpperCase()]?.bg }}
              >
                <Fit text={row.criteria} />
              </td>
              <td className={`${cell} text-center font-semibold`} style={scopeStyle(row.scope)}>
                <Fit text={row.scope} />
              </td>
              <td className={`${cell} text-center tabular-nums`}>
                <Fit text={row.sla} />
              </td>
              <td className={cell}>
                <Clamp text={row.description} />
              </td>
              <td className={`${cell} text-center tabular-nums`}>
                <Fit text={row.planDate} />
              </td>
              <td
                className={`${cell} text-center font-semibold`}
                style={{ color: PROBLEM_SUMMARY.inProgress.bg }}
              >
                <Fit text={row.workStatus} />
              </td>
              <td className={`${cell} text-right tabular-nums`}>
                <Fit text={row.boqAmount} />
              </td>
              <td className={`${cell} text-center`}>
                <Fit text={row.referenceCode} />
              </td>
              <td className={`${cell} text-center`}>
                <BudgetStatus value={row.budgetStatus} />
              </td>
              <td className={`${cell} text-center`}>
                <RiskLevel value={row.riskLevel} />
              </td>
              <td className={cell}>
                <Clamp text={row.riskImpact} />
              </td>
              <td className={cell}>
                <Clamp text={row.remark} />
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
