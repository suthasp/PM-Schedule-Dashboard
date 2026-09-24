import type { JobStatus } from "@/types/schedule";

export const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRK3EBk-mmlkd8OLq9FWcZ54hSeR5ohjt0yTSeImXg7FRX3SzIhNB1JAKuaM3RuvooLbIilWycyiqeH/pub?gid=459638642&single=true&output=csv";

export const DATA_QUERY_KEY = ["pm-schedule"] as const;

export const PROBLEM_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfnK8E3LpCNN7n4vjqdUywTC0zGp1rhkWi7ok-svB8Fnv94mN-0uvQXpGdfKaf_a17q6r836GXvELV/pub?gid=98007425&single=true&output=csv";

export const PROBLEM_QUERY_KEY = ["problem-list"] as const;

export const TRACKING_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRK3EBk-mmlkd8OLq9FWcZ54hSeR5ohjt0yTSeImXg7FRX3SzIhNB1JAKuaM3RuvooLbIilWycyiqeH/pub?gid=145089885&single=true&output=csv";

export const TRACKING_QUERY_KEY = ["data-tracking"] as const;

export const PENALTY_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQFCrRs7oR8BNtfMjdLOI-3lc0HlrWQZJ_f7o69kga3na_WZg3Ant19YOfz4H5YZ-n1aZWCLNBkbRq1/pub?gid=0&single=true&output=csv";

export const PENALTY_QUERY_KEY = ["tickets-penalty"] as const;

export const PENDING_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT_vPqObw-uOYA7tieLnMMg3XZ8SmfshzCO-I8qaAjshSOi2j_vC2OE28tcm19-_I54MDT0Uo273sP_/pub?gid=2146479152&single=true&output=csv";

export const PENDING_QUERY_KEY = ["pending-ticket"] as const;

export const AMC_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRK3EBk-mmlkd8OLq9FWcZ54hSeR5ohjt0yTSeImXg7FRX3SzIhNB1JAKuaM3RuvooLbIilWycyiqeH/pub?gid=51474680&single=true&output=csv";

export const AMC_QUERY_KEY = ["amc-actual"] as const;

export const OPEX_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1wdQs-QYgFhkMh3ik1wwkIwhi40UsFFthLSx0Er3K-piRHgJgJABwhN7lBUnMP5dN1A9LF5oUk_QK/pub?gid=964473229&single=true&output=csv";

export const OPEX_QUERY_KEY = ["opex-2026"] as const;

export const CAPEX_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vT1wdQs-QYgFhkMh3ik1wwkIwhi40UsFFthLSx0Er3K-piRHgJgJABwhN7lBUnMP5dN1A9LF5oUk_QK/pub?gid=1993846865&single=true&output=csv";

export const CAPEX_QUERY_KEY = ["capex-2026"] as const;

/** Default auto-refresh interval: 5 minutes. */
export const DEFAULT_REFRESH_MINUTES = 5;

export const LS_KEYS = {
  settings: "pmsd:settings",
  gridColumnState: "pmsd:grid-column-state-v2",
  problemGridColumnState: "pmsd:problem-grid-column-state-v1",
  trackingGridColumnState: "pmsd:tracking-grid-column-state-v1",
  penaltyGridColumnState: "pmsd:penalty-grid-column-state-v1",
  pendingGridColumnState: "pmsd:pending-grid-column-state-v1",
  amcGridColumnState: "pmsd:amc-grid-column-state-v1",
  opexGridColumnState: "pmsd:opex-grid-column-state-v1",
  capexGridColumnState: "pmsd:capex-grid-column-state-v1",
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

/**
 * Site-card header fills: hue-spaced 700-level tones of equal weight, so
 * every card differs while white text stays ≥4.5:1 on all of them.
 */
export const SITE_COLORS = [
  "#2563eb", // royal blue
  "#0f766e", // teal
  "#7c3aed", // violet
  "#0369a1", // deep sky
  "#15803d", // green
  "#b45309", // amber brown
  "#be123c", // rose
  "#a21caf", // fuchsia
  "#4338ca", // indigo
  "#57534e", // warm gray (spare)
] as const;

/**
 * "PM Completion by Site" card: navy table chrome plus the combo chart's
 * Plan / Actual / % Finished series. Its own pairing (blue / green / orange),
 * distinct from PLAN_ACTUAL_TABLE's amber-and-blue duty-cycle breakdown.
 */
export const SITE_COMPLETION = {
  header: { bg: "#0d366b", fg: "#ffffff" },
  totalTint: "rgba(13, 54, 107, 0.08)",
  plan: { light: "#2a78d6", dark: "#3987e5" },
  actual: { light: "#008300", dark: "#1baf7a" },
  pct: { light: "#c2410c", dark: "#eb6834" },
} as const;

/**
 * Cumulative monthly progress chart. The finished series is a light pink;
 * `pctInk` is the deeper pink used for its text, since light pink alone is
 * too faint for small labels on the light surface.
 */
export const PROGRESS_LINE = {
  cumulative: { light: "#2a78d6", dark: "#3987e5" },
  pct: { light: "#f59ac0", dark: "#f7b3d1" },
  pctInk: { light: "#c2185b", dark: "#f7b3d1" },
  /** Text on the light-pink % badge. */
  badgeText: "#7a1240",
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
  /** Navy header for the in-progress report table. */
  reportHeader: { bg: "#0d366b", fg: "#ffffff" },
  /** Soft row fills per work status in the scope × status pivot. */
  statusRow: {
    finished: { light: "rgba(12,163,12,0.14)", dark: "rgba(12,163,12,0.20)" },
    inProgress: { light: "rgba(235,104,52,0.14)", dark: "rgba(235,104,52,0.22)" },
  },
  scopeAmc: { bg: { light: "#cde2fb", dark: "#1d2f4d" }, ink: { light: "#184f95", dark: "#9ec5f4" } },
  scopeR: { bg: { light: "#fdf0cd", dark: "#3d3113" }, ink: { light: "#8a5a00", dark: "#fab219" } },
  /** Plain "In" — in scope, but neither AMC nor R. */
  scopeIn: { bg: { light: "#d3ede6", dark: "#123330" }, ink: { light: "#0f766e", dark: "#7fd1c1" } },
  scopeOut: { bg: { light: "#fbdccd", dark: "#43261a" }, ink: { light: "#9a3412", dark: "#eb9a7c" } },
} as const;

/** Tickets Penalty summary dashboard: stat-tile fills and SLA donut colors. */
export const PENALTY_SUMMARY = {
  tickets: { bg: "#1d4ed8", fg: "#ffffff" },
  penalty: { bg: "#d03b3b", fg: "#ffffff" },
  charged: { bg: "#eb6834", fg: "#ffffff" },
  waived: { bg: "#0ca30c", fg: "#ffffff" },
  slaWithin: "#0ca30c",
  slaOver: "#d03b3b",
} as const;

/**
 * Chip fills for the Problem sheet's free-text "Status Budget" column, echoing
 * the sheet's own cell colours. First match wins; anything else renders plain.
 */
export const BUDGET_STATUS_CHIPS: { pattern: RegExp; bg: string; fg: string }[] = [
  { pattern: /reject|cancel/i, bg: "#d03b3b", fg: "#ffffff" },
  { pattern: /\bpo\b/i, bg: "#4bc8dd", fg: "#0d366b" },
  { pattern: /\bpr\b/i, bg: "#fab219", fg: "#0d366b" },
  { pattern: /approve|fun(d)?\s*code/i, bg: "#eb6834", fg: "#ffffff" },
  { pattern: /new\s*request/i, bg: "#fbc8ec", fg: "#6b1d52" },
];

/**
 * Chip fills for the OPEX / CAPEX "Last Status" columns. Both sheets use the
 * same workflow with slightly different wording (and CAPEX prefixes a step
 * number), so match on keywords, first match wins — order matters, e.g. the
 * FSO/SVM approval steps must be tested before the generic "approve".
 */
export const EXPENSE_STATUS_CHIPS: { pattern: RegExp; bg: string; fg: string }[] = [
  { pattern: /reject/i, bg: "#d03b3b", fg: "#ffffff" },
  { pattern: /cancel/i, bg: "#57534e", fg: "#ffffff" },
  { pattern: /gr\s*partial/i, bg: "#15803d", fg: "#ffffff" },
  { pattern: /gr\s*(completed|finish)/i, bg: "#0ca30c", fg: "#ffffff" },
  { pattern: /new\s*request/i, bg: "#fbc8ec", fg: "#6b1d52" },
  // Ahead of the PO/PR rules: this step's own text mentions both.
  { pattern: /requester|plan\s*open/i, bg: "#0369a1", fg: "#ffffff" },
  { pattern: /\bpo\b/i, bg: "#4bc8dd", fg: "#0d366b" },
  { pattern: /\bpr\b/i, bg: "#fab219", fg: "#0d366b" },
  { pattern: /fso|rnsa/i, bg: "#4a3aa7", fg: "#ffffff" },
  { pattern: /svm/i, bg: "#a21caf", fg: "#ffffff" },
  { pattern: /budget\s*approve/i, bg: "#eb6834", fg: "#ffffff" },
  { pattern: /fund\s*code|เติมงบ/i, bg: "#7c3aed", fg: "#ffffff" },
];

/** Solid chip fills for the Problem sheet's Criteria column. */
export const CRITERIA_CHIPS: Record<string, { bg: string; fg: string }> = {
  MINOR: { bg: "#fab219", fg: "#0d366b" },
  MAJOR: { bg: "#eb6834", fg: "#ffffff" },
  CRITICAL: { bg: "#d03b3b", fg: "#ffffff" },
};

/** Solid fills for the Problem sheet's Risk Level column, as in the sheet. */
export const RISK_LEVEL_CHIPS: Record<string, { bg: string; fg: string }> = {
  LOW: { bg: "#fbe08a", fg: "#0d366b" },
  MEDIUM: { bg: "#eb9a4e", fg: "#3d1a00" },
  HIGH: { bg: "#d03b3b", fg: "#ffffff" },
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
