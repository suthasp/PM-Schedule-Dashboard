"use client";

import { useMemo, type ReactNode } from "react";
import { ChartCard } from "@/components/ui/ChartCard";
import { EXPENSE_STATUS_CHIPS, SITE_COMPLETION } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

interface Group {
  key: string;
  count: number;
  amount: number;
}

/** "46,000.00" → 46000; blank or non-numeric → 0. */
function parseAmount(raw: string): number {
  const n = Number(raw.replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

/** Group rows by one column, biggest spend first. */
function groupBy(data: ProblemData, header: string | null, amountHeader: string | null): Group[] {
  if (header === null) return [];
  const map = new Map<string, Group>();
  for (const row of data.rows) {
    const key = (row.values[header] ?? "").trim() || "(ไม่ระบุ)";
    const group = map.get(key) ?? { key, count: 0, amount: 0 };
    group.count++;
    if (amountHeader !== null) group.amount += parseAmount(row.values[amountHeader] ?? "");
    map.set(key, group);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount || b.count - a.count);
}

const hairline = { borderColor: "var(--hairline)" } as const;

function StatusChip({ value }: { value: string }): ReactNode {
  const chip = EXPENSE_STATUS_CHIPS.find((c) => c.pattern.test(value));
  if (!chip) return <span>{value}</span>;
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4"
      style={{ backgroundColor: chip.bg, color: chip.fg }}
    >
      {value}
    </span>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }): ReactNode {
  return (
    <div className="card p-4">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="text-muted mt-0.5 text-xs">{sub}</p> : null}
    </div>
  );
}

function GroupTable({
  label,
  rows,
  total,
  chips,
}: {
  label: string;
  rows: Group[];
  total: { count: number; amount: number };
  /** Render the key as a coloured status chip. */
  chips?: boolean;
}): ReactNode {
  const headerCell = "whitespace-nowrap border px-2 py-1.5 text-xs font-bold";
  const cell = "border px-2 py-1 text-right tabular-nums";

  if (rows.length === 0) {
    return <p className="text-muted py-6 text-center text-sm">No records match the search.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr
            style={{ backgroundColor: SITE_COMPLETION.header.bg, color: SITE_COMPLETION.header.fg }}
          >
            <th className={`${headerCell} text-left`} style={hairline}>
              {label}
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              จำนวนงาน
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              จำนวนเงิน (บาท)
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              % ของยอดเงิน
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="border px-2 py-1" style={hairline}>
                {chips ? <StatusChip value={r.key} /> : r.key}
              </td>
              <td className={cell} style={hairline}>
                {formatNumber(r.count)}
              </td>
              <td className={cell} style={hairline}>
                {formatCurrency(r.amount)}
              </td>
              <td className={cell} style={hairline}>
                {formatPercent(total.amount === 0 ? 0 : (r.amount / total.amount) * 100)}
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: SITE_COMPLETION.totalTint }}>
            <td className="border px-2 py-1 font-bold" style={hairline}>
              รวม
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatNumber(total.count)}
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatCurrency(total.amount)}
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatPercent(total.amount === 0 ? 0 : 100)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface SheetSummaryProps {
  /** Already narrowed and searched, so the summary tracks what the grid shows. */
  data: ProblemData;
  statusHeader: string | null;
  amountHeader: string | null;
  buHeader: string | null;
  /** Heading for the second table, e.g. "BU" or "Site Name". */
  buLabel: string;
}

/** Work count and spend by workflow status and by business unit. */
export function SheetSummary({
  data,
  statusHeader,
  amountHeader,
  buHeader,
  buLabel,
}: SheetSummaryProps): ReactNode {
  const byStatus = useMemo(
    () => groupBy(data, statusHeader, amountHeader),
    [data, statusHeader, amountHeader],
  );
  const byBu = useMemo(() => groupBy(data, buHeader, amountHeader), [data, buHeader, amountHeader]);

  const total = useMemo(() => {
    const amount = byStatus.reduce((s, g) => s + g.amount, 0);
    return { count: data.rows.length, amount };
  }, [byStatus, data.rows.length]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile label="จำนวนงาน" value={formatNumber(total.count)} sub="records in view" />
        <Tile label="จำนวนเงินรวม" value={formatCurrency(total.amount)} sub="บาท" />
        <Tile label="Last Status" value={formatNumber(byStatus.length)} sub="สถานะที่พบ" />
        <Tile label={buLabel} value={formatNumber(byBu.length)} sub="หน่วยงานที่พบ" />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ChartCard title="Last Status" subtitle="จำนวนงานและจำนวนเงินตามสถานะ">
          <GroupTable label="Last Status" rows={byStatus} total={total} chips />
        </ChartCard>
        <ChartCard title={buLabel} subtitle={`จำนวนงานและจำนวนเงินตาม ${buLabel}`}>
          <GroupTable label={buLabel} rows={byBu} total={total} />
        </ChartCard>
      </div>
    </div>
  );
}
