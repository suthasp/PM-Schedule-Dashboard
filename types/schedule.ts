/** Derived status of a single scheduled PM occurrence. */
export type JobStatus = "Completed" | "In Progress" | "Remaining" | "Overdue";

export const JOB_STATUSES: readonly JobStatus[] = [
  "Completed",
  "In Progress",
  "Remaining",
  "Overdue",
] as const;

/** A week column parsed from the sheet header (e.g. "WK27" under "July"). */
export interface WeekInfo {
  /** Header label, e.g. "WK27". */
  label: string;
  /** ISO week number parsed from the label. */
  weekNumber: number;
  /** Month name from the month header row (forward-filled). */
  month: string;
  /** Calendar year the week falls in (derived from fiscal-year order). */
  year: number;
  /** ISO date (yyyy-mm-dd) of the Monday starting this week. */
  startDate: string;
  /** Position within the fiscal-year header order (0-based). */
  index: number;
}

/** One raw row of the sheet: a PM task for one site, kept schema-agnostic. */
export interface TaskRow {
  id: string;
  /** Raw cell values keyed by CSV header — adapts to new columns automatically. */
  values: Record<string, string>;
  /** Derived rollup status across this task's scheduled weeks (null if none scheduled). */
  status: JobStatus | null;
  jobCount: number;
  completedCount: number;
}

/** A single scheduled PM occurrence: one non-empty week cell of a task row. */
export interface PMJob {
  id: string;
  taskId: string;
  category: string;
  workInstruction: string;
  dutyCycle: string;
  site: string;
  /** Raw cell mark from the sheet (e.g. "P", "F"). */
  mark: string;
  week: WeekInfo;
  status: JobStatus;
}

export type ColumnKind = "text" | "number" | "date" | "boolean" | "percent" | "week";

/** Detected shape of one CSV column, used to auto-build grid columns. */
export interface ColumnMeta {
  header: string;
  kind: ColumnKind;
}

/** Fully parsed + derived dataset built from the published CSV. */
export interface ScheduleData {
  headers: string[];
  columns: ColumnMeta[];
  weeks: WeekInfo[];
  tasks: TaskRow[];
  jobs: PMJob[];
  sites: string[];
  categories: string[];
  dutyCycles: string[];
  /** Months in fiscal-year order as they appear in the sheet. */
  months: string[];
  years: number[];
  /** Header names resolved for the well-known dimensions. */
  fields: {
    category: string;
    workInstruction: string;
    dutyCycle: string;
    site: string;
  };
}

export interface Filters {
  year: number | "all";
  month: string | "all";
  site: string | "all";
  status: JobStatus | "all";
  category: string | "all";
  dutyCycle: string | "all";
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  year: "all",
  month: "all",
  site: "all",
  status: "all",
  category: "all",
  dutyCycle: "all",
  search: "",
};

export interface KpiSummary {
  total: number;
  completed: number;
  inProgress: number;
  remaining: number;
  overdue: number;
  completionRate: number;
}
