"use client";

import { Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import { SheetSummary } from "@/components/sheet/SheetSummary";
import { GridSkeleton } from "@/components/ui/Loading";
import type { ProblemData } from "@/types/problem";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

interface SheetColumnsViewProps {
  data: ProblemData;
  /**
   * Sheet columns to show, by their position in the sheet (0-based, so B = 1).
   * Positions rather than labels, because these sheets' headers are long Thai
   * sentences that are likely to be reworded.
   */
  columnIndexes: number[];
  /** Short display label for each of those columns, in the same order. */
  columnLabels: string[];
  /** localStorage key base for the grid's column state. */
  storageKeyBase: string;
  /**
   * Sheet position of the column the rows are ordered by, newest first.
   * Compared naturally, so "CPW26-0999" sorts below "CPW26-1000".
   */
  sortByIndex: number;
  /** Sheet positions feeding the summary above the grid. */
  summary: { statusIndex: number; amountIndex: number; buIndex: number; buLabel: string };
}

/**
 * A narrowed view of a flat sheet: only the reported columns, relabelled, with
 * a free-text search across all of them above the grid.
 */
export function SheetColumnsView({
  data,
  columnIndexes,
  columnLabels,
  storageKeyBase,
  sortByIndex,
  summary,
}: SheetColumnsViewProps): ReactNode {
  const [search, setSearch] = useState("");

  const scoped = useMemo<ProblemData>(() => {
    const columns = columnIndexes
      .map((i, n) => {
        const col = data.columns[i];
        return col ? { ...col, label: columnLabels[n] ?? col.label } : null;
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const sortHeader = data.columns[sortByIndex]?.header;
    const rows =
      sortHeader === undefined
        ? data.rows
        : [...data.rows].sort((a, b) =>
            (b.values[sortHeader] ?? "").localeCompare(a.values[sortHeader] ?? "", undefined, {
              numeric: true,
              sensitivity: "base",
            }),
          );
    return { ...data, columns, rows };
  }, [data, columnIndexes, columnLabels, sortByIndex]);

  const filtered = useMemo<ProblemData>(() => {
    const q = search.trim().toLowerCase();
    if (q === "") return scoped;
    const headers = scoped.columns.map((c) => c.header);
    return {
      ...scoped,
      rows: scoped.rows.filter((r) =>
        headers.some((h) => (r.values[h] ?? "").toLowerCase().includes(q)),
      ),
    };
  }, [scoped, search]);

  const headerAt = (i: number): string | null => data.columns[i]?.header ?? null;

  return (
    <div className="space-y-3">
      <div className="card no-print flex items-center gap-3 p-3">
        <div className="relative w-full max-w-md">
          <Search
            size={15}
            aria-hidden
            className="text-muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาข้อความทั้งหมดในตาราง…"
            aria-label="Search the table"
            className="h-9 w-full rounded-xl border hairline pl-9 pr-9 text-sm outline-none transition-colors focus:border-accent dark:focus:border-accent-dark"
            style={{ backgroundColor: "var(--surface)" }}
          />
          {search !== "" && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="text-muted absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
        <p className="text-secondary text-sm">
          {filtered.rows.length.toLocaleString()} of {scoped.rows.length.toLocaleString()} records
        </p>
      </div>

      <SheetSummary
        data={filtered}
        statusHeader={headerAt(summary.statusIndex)}
        amountHeader={headerAt(summary.amountIndex)}
        buHeader={headerAt(summary.buIndex)}
        buLabel={summary.buLabel}
      />

      <ProblemGridTable
        data={filtered}
        storageKeyBase={storageKeyBase}
        itemLabel="records"
        autoSizeOnLoad
      />
    </div>
  );
}
