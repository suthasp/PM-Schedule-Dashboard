"use client";

import { Download, Loader2, Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AirconSummary } from "@/components/aircon/AirconSummary";
import { GridSkeleton } from "@/components/ui/Loading";
import type { ProblemData } from "@/types/problem";
import { exportSheetXlsx } from "@/utils/exportSheetXlsx";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

interface AirconViewProps {
  data: ProblemData;
  /** "PM" for the Preventive sheet, "CM" for Corrective. */
  kind: "PM" | "CM";
  /** localStorage key base for the grid's column state. */
  storageKeyBase: string;
  /** Worksheet name and file-name stem for the Excel export. */
  exportName: string;
}

/** Dashboard, free-text search, full record grid and Excel export for one AC sheet. */
export function AirconView({
  data,
  kind,
  storageKeyBase,
  exportName,
}: AirconViewProps): ReactNode {
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo<ProblemData>(() => {
    const q = search.trim().toLowerCase();
    if (q === "") return data;
    const headers = data.columns.map((c) => c.header);
    return {
      ...data,
      rows: data.rows.filter((r) => headers.some((h) => (r.values[h] ?? "").toLowerCase().includes(q))),
    };
  }, [data, search]);

  const exportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const today = new Date();
      const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate(),
      ).padStart(2, "0")}`;
      // Exports what is on screen, so a search narrows the file too.
      await exportSheetXlsx(filtered, `${exportName}-${stamp}.xlsx`, exportName);
    } finally {
      setExporting(false);
    }
  }, [filtered, exportName]);

  return (
    <div className="space-y-3">
      <div className="card no-print flex flex-wrap items-center gap-3 p-3">
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
          {filtered.rows.length.toLocaleString()} of {data.rows.length.toLocaleString()} records
        </p>
        <button
          type="button"
          onClick={() => void exportExcel()}
          disabled={exporting || filtered.rows.length === 0}
          className="ml-auto flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-accent-dark"
        >
          {exporting ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <Download size={15} aria-hidden />
          )}
          Export Excel
        </button>
      </div>

      <AirconSummary data={filtered} kind={kind} />

      <ProblemGridTable
        data={filtered}
        storageKeyBase={storageKeyBase}
        itemLabel="records"
        autoSizeOnLoad
        heightClass="h-[78vh] min-h-[560px]"
        pageSize={50}
      />
    </div>
  );
}
