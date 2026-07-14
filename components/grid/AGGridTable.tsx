"use client";

import type {
  CellKeyDownEvent,
  ColDef,
  ColumnState,
  GridApi,
  GridReadyEvent,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Columns3, Download, Maximize2, RotateCcw } from "lucide-react";
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
import { LS_KEYS } from "@/lib/constants";
import type { ScheduleData, TaskRow } from "@/types/schedule";
import { buildColumnDefs, type GridRow } from "@/utils/columns";
import { groupJobsByTask } from "@/utils/transform";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

interface AGGridTableProps {
  data: ScheduleData;
  tasks: TaskRow[];
}

/** Column-state storage is keyed by the header signature so a sheet-schema change resets cleanly. */
function storageKey(data: ScheduleData): string {
  return `${LS_KEYS.gridColumnState}:${data.headers.join("|").length}-${data.headers.length}`;
}

export function AGGridTable({ data, tasks }: AGGridTableProps): ReactNode {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  const { filters } = useFilters();
  const { settings } = useSettings();
  const apiRef = useRef<GridApi<GridRow> | null>(null);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<ReadonlySet<string>>(new Set());
  const [selectedCount, setSelectedCount] = useState(0);

  const rows = useMemo<GridRow[]>(() => {
    const byTask = groupJobsByTask(data.jobs);
    return tasks.map((t) => {
      const weekStatus: GridRow["weekStatus"] = {};
      for (const job of byTask.get(t.id) ?? []) {
        weekStatus[job.week.label] = job.status;
      }
      return { id: t.id, values: t.values, status: t.status, weekStatus };
    });
  }, [data.jobs, tasks]);

  const columnDefs = useMemo<ColDef<GridRow>[]>(() => buildColumnDefs(data, dark), [data, dark]);

  const defaultColDef = useMemo<ColDef<GridRow>>(
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
    (e: GridReadyEvent<GridRow>) => {
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
  }, [filters.search, rows]);

  // With rows ticked, export only those; otherwise the whole dataset.
  const exportCsv = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    api.exportDataAsCsv({
      fileName: `${settings.exportFilePrefix}-${new Date().toISOString().slice(0, 10)}.csv`,
      allColumns: !settings.exportVisibleColumnsOnly,
      onlySelected: api.getSelectedNodes().length > 0,
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
  const onCellKeyDown = useCallback((e: CellKeyDownEvent<GridRow>) => {
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
          {rows.length.toLocaleString()} tasks · {data.jobs.length.toLocaleString()} scheduled jobs
          {selectedCount > 0 ? ` · ${selectedCount.toLocaleString()} selected` : ""}
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
          Export CSV{selectedCount > 0 ? ` (${selectedCount.toLocaleString()})` : ""}
        </button>
      </div>

      <div
        className={`${dark ? "ag-theme-quartz-dark" : "ag-theme-quartz"} h-[68vh] min-h-[420px] w-full overflow-hidden rounded-card shadow-soft`}
        onClick={() => columnsMenuOpen && setColumnsMenuOpen(false)}
      >
        <AgGridReact<GridRow>
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          getRowId={(p) => p.data.id}
          rowHeight={32}
          pagination
          paginationPageSize={25}
          paginationPageSizeSelector={[25, 50, 100, 200]}
          rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true }}
          enableCellTextSelection
          onCellKeyDown={onCellKeyDown}
          onSelectionChanged={(e) => setSelectedCount(e.api.getSelectedNodes().length)}
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
