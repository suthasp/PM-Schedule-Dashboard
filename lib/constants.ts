import type { JobStatus } from "@/types/schedule";

export const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRK3EBk-mmlkd8OLq9FWcZ54hSeR5ohjt0yTSeImXg7FRX3SzIhNB1JAKuaM3RuvooLbIilWycyiqeH/pub?gid=459638642&single=true&output=csv";

export const DATA_QUERY_KEY = ["pm-schedule"] as const;

export const PROBLEM_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfnK8E3LpCNN7n4vjqdUywTC0zGp1rhkWi7ok-svB8Fnv94mN-0uvQXpGdfKaf_a17q6r836GXvELV/pub?gid=98007425&single=true&output=csv";

export const PROBLEM_QUERY_KEY = ["problem-list"] as const;

/** Default auto-refresh interval: 5 minutes. */
export const DEFAULT_REFRESH_MINUTES = 5;

export const LS_KEYS = {
  settings: "pmsd:settings",
  gridColumnState: "pmsd:grid-column-state-v2",
  problemGridColumnState: "pmsd:problem-grid-column-state-v1",
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

/** Solid chip fills for week-mark cells in the schedule grid. */
export const STATUS_CHIPS: Record<JobStatus, { bg: string; fg: string }> = {
  Finished: { bg: "#0ca30c", fg: "#ffffff" },
  Remaining: { bg: "#fab219", fg: "#0d366b" },
  Overdue: { bg: "#d03b3b", fg: "#ffffff" },
};

/** Plan-vs-Actual table: solid group-header fills + theme-aware number ink. */
export const PLAN_ACTUAL_TABLE = {
  plan: { header: "#a16207", ink: { light: "#a16207", dark: "#fab219" } },
  actual: { header: "#1d4ed8", ink: { light: "#1d4ed8", dark: "#6da7ec" } },
  pct: { header: "#6d28d9" },
  duty: { header: "#9a3412", ink: { light: "#9a3412", dark: "#eb6834" } },
} as const;

/** Monthly per-site pivot: translucent column tints that work on both themes. */
export const MONTH_PIVOT_TINTS = {
  plan: "rgba(74, 58, 167, 0.10)",
  done: "rgba(12, 163, 12, 0.10)",
  remain: "rgba(208, 59, 59, 0.10)",
  monthFirstHalf: "rgba(42, 120, 214, 0.14)",
  monthSecondHalf: "rgba(235, 104, 52, 0.14)",
} as const;

/** Problem summary dashboard: stat-tile fills (solid) and scope tints. */
export const PROBLEM_SUMMARY = {
  problem: { bg: "#1d4ed8", fg: "#ffffff" },
  finished: { bg: "#0ca30c", fg: "#ffffff" },
  inProgress: { bg: "#eb6834", fg: "#ffffff" },
  scopeAmc: { bg: { light: "#cde2fb", dark: "#1d2f4d" }, ink: { light: "#184f95", dark: "#9ec5f4" } },
  scopeR: { bg: { light: "#fdf0cd", dark: "#3d3113" }, ink: { light: "#8a5a00", dark: "#fab219" } },
  scopeOut: { bg: { light: "#fbdccd", dark: "#43261a" }, ink: { light: "#9a3412", dark: "#eb9a7c" } },
} as const;

/** Solid chip fills for the Problem sheet's Criteria column. */
export const CRITERIA_CHIPS: Record<string, { bg: string; fg: string }> = {
  MINOR: { bg: "#fab219", fg: "#0d366b" },
  MAJOR: { bg: "#eb6834", fg: "#ffffff" },
  CRITICAL: { bg: "#d03b3b", fg: "#ffffff" },
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
