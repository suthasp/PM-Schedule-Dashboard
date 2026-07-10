"use client";

import type {
  CellKeyDownEvent,
  ColDef,
  ColumnState,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Columns3, Download, ExternalLink, Maximize2, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import { useSettings } from "@/components/providers/SettingsProvider";
import { CRITERIA_CHIPS, LS_KEYS } from "@/lib/constants";
import type { ProblemData, ProblemRow } from "@/types/problem";
import { parseDmyMs } from "@/utils/problemTransform";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

interface ProblemGridTableProps {
  data: ProblemData;
}

/** Column-state storage is keyed by the header signature so a sheet-schema change resets cleanly. */
function storageKey(data: ProblemData): string {
  const headers = data.columns.map((c) => c.header);
  return `${LS_KEYS.problemGridColumnState}:${headers.join("|").length}-${headers.length}`;
}

function parseNumeric(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

function LinkCell(p: ICellRendererParams<ProblemRow>): ReactNode {
  const value = typeof p.value === "string" ? p.value.trim() : "";
  if (!value) return null;
  // Link columns can still hold the odd plain filename — show it as text.
  if (!/^https?:\/\//i.test(value)) return value;
  return (
    <a
      href={value}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-accent underline underline-offset-2 dark:text-accent-dark"
    >
      Open
      <ExternalLink size={12} aria-hidden />
    </a>
  );
}

function CriteriaCell(p: ICellRendererParams<ProblemRow>): ReactNode {
  const value = typeof p.value === "string" ? p.value.trim() : "";
  if (!value) return null;
  const chip = CRITERIA_CHIPS[value.toUpperCase()];
  if (!chip) return value;
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[11px] font-bold leading-4"
      style={{ backgroundColor: chip.bg, color: chip.fg }}
    >
      {value}
    </span>
  );
}

/** Free-text columns holding long Thai descriptions get room and tooltips. */
const LONG_TEXT = /description|remark|รายละเอียด|แก้ไข|detail/i;

function buildProblemColumnDefs(data: ProblemData): ColDef<ProblemRow>[] {
  const cols = data.columns.map<ColDef<ProblemRow>>(({ header, label, kind }) => {
    const base: ColDef<ProblemRow> = {
      colId: header,
      headerName: label,
      headerTooltip: header === label ? undefined : header.replace(/\s*\n\s*/g, " "),
      valueGetter: (p) => p.data?.values[header] ?? "",
      sortable: true,
      resizable: true,
      filter: "agTextColumnFilter",
      floatingFilter: true,
      minWidth: 100,
    };

    switch (kind) {
      case "number":
        return {
          ...base,
          filter: "agNumberColumnFilter",
          type: "rightAligned",
          width: 100,
          valueGetter: (p) => parseNumeric(p.data?.values[header] ?? ""),
          valueFormatter: (p) => p.data?.values[header] ?? "",
          comparator: (a: number | null, b: number | null) => (a ?? -Infinity) - (b ?? -Infinity),
        };
      case "date":
        return {
          ...base,
          filter: "agDateColumnFilter",
          width: 130,
          comparator: (_a: string, _b: string, nodeA, nodeB) => {
            const ta = parseDmyMs(nodeA.data?.values[header] ?? "") ?? 0;
            const tb = parseDmyMs(nodeB.data?.values[header] ?? "") ?? 0;
            return ta - tb;
          },
          filterParams: {
            comparator: (filterDate: Date, cellValue: string) => {
              const cell = parseDmyMs(cellValue ?? "");
              if (cell === null) return -1;
              const f = Date.UTC(
                filterDate.getFullYear(),
                filterDate.getMonth(),
                filterDate.getDate(),
              );
              return cell === f ? 0 : cell < f ? -1 : 1;
            },
          },
        };
      case "link":
        return {
          ...base,
          filter: false,
          floatingFilter: false,
          width: 110,
          cellRenderer: LinkCell,
        };
      default:
        if (/^criteria/i.test(label)) {
          return { ...base, width: 110, cellRenderer: CriteriaCell };
        }
        return {
          ...base,
          flex: LONG_TEXT.test(label) ? 2 : undefined,
          minWidth: LONG_TEXT.test(label) ? 240 : 100,
          tooltipValueGetter: (p) => p.data?.values[header] ?? "",
        };
    }
  });

  // Pin the row number and site columns for orientation while scrolling wide.
  return cols.map((c) => {
    if (c.headerName === "No.") return { ...c, pinned: "left", width: 70, minWidth: 60 };
    if (c.headerName === "CN Site") return { ...c, pinned: "left", width: 120, minWidth: 100 };
    return c;
  });
}

export function ProblemGridTable({ data }: ProblemGridTableProps): ReactNode {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const { filters } = useFilters();
  const { settings } = useSettings();
  const apiRef = useRef<GridApi<ProblemRow> | null>(null);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<ReadonlySet<string>>(new Set());

  const columnDefs = useMemo<ColDef<ProblemRow>[]>(() => buildProblemColumnDefs(data), [data]);

  const defaultColDef = useMemo<ColDef<ProblemRow>>(
    () => ({ sortable: true, resizable: true, suppressHeaderMenuButton: false }),
    [],
  );

  const persistColumnState = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    try {
      window.localStorage.setItem(storageKey(data), JSON.stringify(api.getColumnState()));
    } catch {
      // storage unavailable — column layout just won't persist
    }
  }, [data]);

  const onGridReady = useCallback(
    (e: GridReadyEvent<ProblemRow>) => {
      apiRef.current = e.api;
      try {
        const raw = window.localStorage.getItem(storageKey(data));
        if (raw) {
          e.api.applyColumnState({
            state: JSON.parse(raw) as ColumnState[],
            applyOrder: true,
          });
        }
      } catch {
        // corrupted state — ignore and use defaults
      }
    },
    [data],
  );

  // Global search doubles as the grid quick filter.
  useEffect(() => {
    apiRef.current?.setGridOption("quickFilterText", filters.search);
  }, [filters.search, data.rows]);

  const exportCsv = useCallback(() => {
    apiRef.current?.exportDataAsCsv({
      fileName: `${settings.exportFilePrefix}-problems-${new Date().toISOString().slice(0, 10)}.csv`,
      allColumns: !settings.exportVisibleColumnsOnly,
    });
  }, [settings]);

  const autoSize = useCallback(() => {
    apiRef.current?.autoSizeAllColumns();
    persistColumnState();
  }, [persistColumnState]);

  const resetColumns = useCallback(() => {
    apiRef.current?.resetColumnState();
    setHiddenCols(new Set());
    try {
      window.localStorage.removeItem(storageKey(data));
    } catch {
      // ignore
    }
  }, [data]);

  const toggleColumn = useCallback(
    (colId: string) => {
      const api = apiRef.current;
      if (!api) return;
      const next = new Set(hiddenCols);
      const hide = !next.has(colId);
      if (hide) next.add(colId);
      else next.delete(colId);
      setHiddenCols(next);
      api.setColumnsVisible([colId], !hide);
      persistColumnState();
    },
    [hiddenCols, persistColumnState],
  );

  // Ctrl/Cmd+C copies the focused cell (clipboard range copy is enterprise-only).
  const onCellKeyDown = useCallback((e: CellKeyDownEvent<ProblemRow>) => {
    const ev = e.event as KeyboardEvent | null;
    if (ev && (ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "c") {
      const value = e.value as unknown;
      if (value !== null && value !== undefined) {
        void navigator.clipboard.writeText(String(value));
      }
    }
  }, []);

  return (
    <div className="space-y-3">
      <div className="no-print flex flex-wrap items-center gap-2">
        <p className="text-secondary mr-auto text-sm">
          {data.rows.length.toLocaleString()} problems
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setColumnsMenuOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-xl border hairline px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <Columns3 size={15} aria-hidden />
            Columns
          </button>
          {columnsMenuOpen && (
            <div className="card absolute right-0 z-20 mt-1 max-h-72 w-56 overflow-y-auto p-2 shadow-soft-lg">
              {columnDefs.map((c) => {
                const colId = c.colId ?? "";
                return (
                  <label
                    key={colId}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(colId)}
                      onChange={() => toggleColumn(colId)}
                    />
                    <span className="truncate">{c.headerName}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={autoSize}
          className="flex h-9 items-center gap-1.5 rounded-xl border hairline px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <Maximize2 size={15} aria-hidden />
          Auto-size
        </button>
        <button
          type="button"
          onClick={resetColumns}
          className="flex h-9 items-center gap-1.5 rounded-xl border hairline px-3 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <RotateCcw size={15} aria-hidden />
          Reset
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-accent-dark"
        >
          <Download size={15} aria-hidden />
          Export CSV
        </button>
      </div>

      <div
        className={`${dark ? "ag-theme-quartz-dark" : "ag-theme-quartz"} h-[68vh] min-h-[420px] w-full overflow-hidden rounded-card shadow-soft`}
        onClick={() => columnsMenuOpen && setColumnsMenuOpen(false)}
      >
        <AgGridReact<ProblemRow>
          rowData={data.rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          getRowId={(p) => p.data.id}
          pagination
          paginationPageSize={25}
          paginationPageSizeSelector={[25, 50, 100, 200]}
          rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true }}
          enableCellTextSelection
          onCellKeyDown={onCellKeyDown}
          onColumnMoved={persistColumnState}
          onColumnResized={persistColumnState}
          onColumnVisible={persistColumnState}
          onColumnPinned={persistColumnState}
          onSortChanged={persistColumnState}
          animateRows
          tooltipShowDelay={400}
        />
      </div>
    </div>
  );
}
