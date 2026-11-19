"use client";

import { FilterX, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import { SheetSummary } from "@/components/sheet/SheetSummary";
import { GridSkeleton } from "@/components/ui/Loading";
import { MultiSelect } from "@/components/ui/MultiSelect";
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
  /** Empty = All. Values of the summary's status column. */
  const [status, setStatus] = useState<string[]>([]);

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

  const headerAt = (i: number): string | null => data.columns[i]?.header ?? null;

  const statusHeader = headerAt(summary.statusIndex);
  /** Label the dropdown exactly as that column is labelled in the grid. */
  const statusLabel =
    columnLabels[columnIndexes.indexOf(summary.statusIndex)] ?? "Last Status";

  const statusOptions = useMemo(() => {
    if (statusHeader === null) return [];
    const seen = new Set<string>();
    for (const r of scoped.rows) {
      const v = (r.values[statusHeader] ?? "").trim();
      if (v !== "") seen.add(v);
    }
    // Natural sort, so "00.Reject" … "09.GR Completed" keep the sheet's own order.
    return [...seen].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  }, [scoped, statusHeader]);

  const filtered = useMemo<ProblemData>(() => {
    const q = search.trim().toLowerCase();
    const headers = scoped.columns.map((c) => c.header);
    const picked = new Set(status);
    if (q === "" && picked.size === 0) return scoped;
    return {
      ...scoped,
      rows: scoped.rows.filter((r) => {
        if (picked.size > 0) {
          if (statusHeader === null) return false;
          if (!picked.has((r.values[statusHeader] ?? "").trim())) return false;
        }
        return q === "" || headers.some((h) => (r.values[h] ?? "").toLowerCase().includes(q));
      }),
    };
  }, [scoped, search, status, statusHeader]);

  const activeCount = (search.trim() === "" ? 0 : 1) + (status.length > 0 ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="card no-print flex flex-wrap items-end gap-3 p-3">
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
        {statusHeader !== null && statusOptions.length > 0 && (
          <div className="w-[220px] shrink-0">
            <MultiSelect
              label={statusLabel}
              options={statusOptions}
              selected={status}
              onChange={setStatus}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatus([]);
          }}
          disabled={activeCount === 0}
          className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border hairline px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/5"
        >
          <FilterX size={15} aria-hidden />
          Clear{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>

        <p className="text-secondary pb-2 text-sm">
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
        // These pages carry a summary above the grid, so give the table more
        // room and a page of rows tall enough to fill it.
        heightClass="h-[85vh] min-h-[620px]"
        pageSize={50}
      />
    </div>
  );
}
