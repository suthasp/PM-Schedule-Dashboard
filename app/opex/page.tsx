"use client";

import { Search, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useOpexData } from "@/hooks/useOpexData";
import { LS_KEYS } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

/**
 * Sheet columns to show, by their position in the sheet (B, E, J, S, T, X, Y,
 * AB, AC). Positions rather than labels, because several of this sheet's
 * headers are long Thai sentences that are likely to be reworded.
 */
const COLUMN_INDEXES = [1, 4, 9, 18, 19, 23, 24, 27, 28];

/** Short display labels for those columns, in the same order. */
const COLUMN_LABELS = [
  "Record Reference Code",
  "OPEX Last Status",
  "Record Date",
  "Description รายละเอียดค่าใช้จ่าย",
  "Amount (Bt)",
  "BU",
  "Vendor",
  "สถานะของงาน",
  "Link เอกสาร",
];

function OpexContent({ data }: { data: ProblemData }): ReactNode {
  const [search, setSearch] = useState("");

  // Keep only the reported columns, renamed to their short labels.
  const scoped = useMemo<ProblemData>(() => {
    const columns = COLUMN_INDEXES.map((i, n) => {
      const col = data.columns[i];
      return col ? { ...col, label: COLUMN_LABELS[n] ?? col.label } : null;
    }).filter((c): c is NonNullable<typeof c> => c !== null);
    return { ...data, columns };
  }, [data]);

  // Free-text search across every visible column.
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
            aria-label="Search the OPEX table"
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

      <ProblemGridTable
        data={filtered}
        storageKeyBase={LS_KEYS.opexGridColumnState}
        itemLabel="records"
        autoSizeOnLoad
      />
    </div>
  );
}

export default function OpexPage(): ReactNode {
  const { query, refresh } = useOpexData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load OPEX data" message={query.error.message} onRetry={refresh} />
    );
  }
  return <OpexContent data={query.data} />;
}
