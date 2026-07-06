"use client";

import type { ReactNode } from "react";
import { formatNumber } from "@/utils/format";

export interface TooltipRow {
  name: string;
  value: number;
  color?: string;
}

interface ChartTooltipProps {
  label?: string;
  rows: TooltipRow[];
}

/** Shared tooltip card used by every Recharts chart. */
export function ChartTooltip({ label, rows }: ChartTooltipProps): ReactNode {
  if (rows.length === 0) return null;
  return (
    <div className="card min-w-[130px] px-3 py-2 text-xs shadow-soft-lg">
      {label ? <p className="mb-1 font-semibold">{label}</p> : null}
      {rows.map((r) => (
        <p key={r.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            {r.color ? (
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: r.color }}
                aria-hidden
              />
            ) : null}
            <span className="text-secondary">{r.name}</span>
          </span>
          <span className="font-semibold tabular-nums">{formatNumber(r.value)}</span>
        </p>
      ))}
    </div>
  );
}
