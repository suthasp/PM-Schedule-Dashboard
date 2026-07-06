import type { ColDef } from "ag-grid-community";
import { STATUS_COLORS, STATUS_TINTS } from "@/lib/constants";
import type { JobStatus, ScheduleData } from "@/types/schedule";

/** Flat row shape fed to AG Grid. */
export interface GridRow {
  id: string;
  values: Record<string, string>;
  status: JobStatus | null;
  /** Derived status per week column label (only weeks with a mark). */
  weekStatus: Record<string, JobStatus>;
}

function parseNumeric(raw: string): number | null {
  const cleaned = raw.replace(/[,%]/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

function parseDateMs(raw: string): number | null {
  const t = Date.parse(raw.trim());
  return Number.isNaN(t) ? null : t;
}

/**
 * Auto-generate AG Grid column definitions from the detected CSV columns —
 * new sheet columns appear automatically with type-appropriate filters,
 * sorting and formatting.
 */
export function buildColumnDefs(data: ScheduleData, dark: boolean): ColDef<GridRow>[] {
  const statusCol: ColDef<GridRow> = {
    colId: "__status",
    headerName: "Status",
    pinned: "left",
    width: 130,
    valueGetter: (p) => p.data?.status ?? "",
    filter: "agTextColumnFilter",
    floatingFilter: true,
    cellStyle: (p) => {
      const status = p.data?.status;
      if (!status) return null;
      return {
        color: STATUS_COLORS[status][dark ? "dark" : "light"],
        fontWeight: "600",
      };
    },
  };

  const dataCols = data.columns.map<ColDef<GridRow>>(({ header, kind }) => {
    const base: ColDef<GridRow> = {
      colId: header,
      headerName: header,
      valueGetter: (p) => p.data?.values[header] ?? "",
      sortable: true,
      resizable: true,
      filter: "agTextColumnFilter",
      floatingFilter: true,
      minWidth: 90,
    };

    switch (kind) {
      case "week": {
        const weekInfo = data.weeks.find((w) => w.label === header);
        return {
          ...base,
          headerName: header,
          headerTooltip: weekInfo ? `${weekInfo.month} ${weekInfo.year} · w/c ${weekInfo.startDate}` : header,
          width: 52,
          minWidth: 44,
          floatingFilter: false,
          filter: false,
          cellClass: "text-center font-semibold",
          cellStyle: (p) => {
            const status = p.data?.weekStatus[header];
            if (!status) return null;
            const mode = dark ? "dark" : "light";
            return {
              backgroundColor: STATUS_TINTS[status][mode],
              color: STATUS_COLORS[status][mode],
              textAlign: "center",
            };
          },
        };
      }
      case "number":
      case "percent":
        return {
          ...base,
          filter: "agNumberColumnFilter",
          type: "rightAligned",
          width: 110,
          valueGetter: (p) => parseNumeric(p.data?.values[header] ?? ""),
          valueFormatter: (p) => {
            const raw = p.data?.values[header] ?? "";
            return raw;
          },
          comparator: (a: number | null, b: number | null) => (a ?? -Infinity) - (b ?? -Infinity),
        };
      case "date":
        return {
          ...base,
          filter: "agDateColumnFilter",
          width: 130,
          comparator: (_a: string, _b: string, nodeA, nodeB) => {
            const ta = parseDateMs(nodeA.data?.values[header] ?? "") ?? 0;
            const tb = parseDateMs(nodeB.data?.values[header] ?? "") ?? 0;
            return ta - tb;
          },
        };
      case "boolean":
        return {
          ...base,
          width: 100,
          valueGetter: (p) => {
            const v = (p.data?.values[header] ?? "").trim().toLowerCase();
            if (v === "") return "";
            return v === "true" || v === "yes" ? "Yes" : "No";
          },
        };
      default:
        return {
          ...base,
          flex: header.toLowerCase().includes("instruction") ? 2 : undefined,
          minWidth: header.toLowerCase().includes("instruction") ? 240 : 110,
          tooltipValueGetter: (p) => p.data?.values[header] ?? "",
        };
    }
  });

  return [statusCol, ...dataCols];
}
