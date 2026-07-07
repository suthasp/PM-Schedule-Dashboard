import type { JobStatus } from "@/types/schedule";

export const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRK3EBk-mmlkd8OLq9FWcZ54hSeR5ohjt0yTSeImXg7FRX3SzIhNB1JAKuaM3RuvooLbIilWycyiqeH/pub?gid=459638642&single=true&output=csv";

export const DATA_QUERY_KEY = ["pm-schedule"] as const;

/** Default auto-refresh interval: 5 minutes. */
export const DEFAULT_REFRESH_MINUTES = 5;

export const LS_KEYS = {
  settings: "pmsd:settings",
  gridColumnState: "pmsd:grid-column-state",
  sidebarCollapsed: "pmsd:sidebar-collapsed",
} as const;

/**
 * Status colors (light / dark surface variants) — status palette from the
 * validated reference palette.
 */
export const STATUS_COLORS: Record<JobStatus, { light: string; dark: string }> = {
  Finished: { light: "#0ca30c", dark: "#0ca30c" },
  Remaining: { light: "#fab219", dark: "#fab219" },
  Overdue: { light: "#d03b3b", dark: "#d03b3b" },
};

/** Soft row/background tints per status for grid rows and badges. */
export const STATUS_TINTS: Record<JobStatus, { light: string; dark: string }> = {
  Finished: { light: "rgba(12,163,12,0.10)", dark: "rgba(12,163,12,0.16)" },
  Remaining: { light: "rgba(250,178,25,0.14)", dark: "rgba(250,178,25,0.14)" },
  Overdue: { light: "rgba(208,59,59,0.10)", dark: "rgba(208,59,59,0.18)" },
};

/** Fixed-order categorical palette (validated) for identity encodings. */
export const CATEGORICAL: { light: string[]; dark: string[] } = {
  light: ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"],
  dark: ["#3987e5", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181", "#d95926"],
};

/** Sequential blue ramp (100→700) for the calendar heatmap. */
export const SEQUENTIAL_BLUE = [
  "#cde2fb",
  "#9ec5f4",
  "#6da7ec",
  "#3987e5",
  "#256abf",
  "#184f95",
  "#0d366b",
] as const;

export const CHART_INK = {
  light: { primary: "#0b0b0b", secondary: "#52514e", muted: "#898781", grid: "#e1e0d9" },
  dark: { primary: "#ffffff", secondary: "#c3c2b7", muted: "#898781", grid: "#2c2c2a" },
} as const;
