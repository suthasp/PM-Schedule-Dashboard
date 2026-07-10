import type {
  ColumnKind,
  ColumnMeta,
  Filters,
  JobStatus,
  KpiSummary,
  PMJob,
  ScheduleData,
  TaskRow,
  WeekInfo,
} from "@/types/schedule";
import { currentWeekMondayTime, isoWeekMonday, isoWeekOf, toIsoDate } from "@/utils/weeks";

const WEEK_HEADER = /^WK\s*(\d{1,2})$/i;

/** Marks that mean "done" in the sheet's week cells. */
const FINISHED_MARKS = new Set(["F", "DONE", "C", "OK"]);

function findHeader(headers: string[], patterns: RegExp[], fallbackIndex: number): string {
  for (const pattern of patterns) {
    const hit = headers.find((h) => pattern.test(h));
    if (hit) return hit;
  }
  return headers[fallbackIndex] ?? headers[0] ?? "";
}

function detectKind(header: string, samples: string[]): ColumnKind {
  if (WEEK_HEADER.test(header)) return "week";
  const filled = samples.filter((s) => s.trim() !== "");
  if (filled.length === 0) return "text";
  if (filled.every((s) => /^-?[\d,]+(\.\d+)?%$/.test(s.trim()))) return "percent";
  if (filled.every((s) => /^-?[\d,]+(\.\d+)?$/.test(s.trim()))) return "number";
  if (
    filled.every((s) => {
      const v = s.trim().toLowerCase();
      return v === "true" || v === "false" || v === "yes" || v === "no";
    })
  ) {
    return "boolean";
  }
  if (
    filled.every((s) => {
      const t = Date.parse(s.trim());
      return !Number.isNaN(t) && /[/\-]/.test(s);
    })
  ) {
    return "date";
  }
  return "text";
}

/**
 * Build the week timeline from the two header rows. The sheet is a fiscal-year
 * matrix (e.g. WK27 July → WK26 June); the month row is forward-filled across
 * its merged cells, and each week is anchored to a real ISO-week Monday so
 * statuses can be derived against today's date.
 */
function buildWeeks(monthRow: string[], headerRow: string[], now: Date): WeekInfo[] {
  const weekCols: { col: number; label: string; weekNumber: number; month: string }[] = [];
  let currentMonth = "";
  for (let col = 0; col < headerRow.length; col++) {
    const monthCell = (monthRow[col] ?? "").trim();
    if (monthCell) currentMonth = monthCell;
    const header = (headerRow[col] ?? "").trim();
    const match = WEEK_HEADER.exec(header);
    if (match?.[1]) {
      weekCols.push({ col, label: header, weekNumber: Number(match[1]), month: currentMonth });
    }
  }
  if (weekCols.length === 0) return [];

  const startWeek = weekCols[0]?.weekNumber ?? 1;
  const nowIso = isoWeekOf(now);
  // The fiscal year starting at `startWeek` that contains today.
  const fyStartYear = nowIso.week >= startWeek ? nowIso.year : nowIso.year - 1;

  return weekCols.map((w, index) => {
    const year = w.weekNumber >= startWeek ? fyStartYear : fyStartYear + 1;
    return {
      label: w.label,
      weekNumber: w.weekNumber,
      month: w.month,
      year,
      startDate: toIsoDate(isoWeekMonday(year, w.weekNumber)),
      index,
    };
  });
}

function statusFor(mark: string, weekStart: string, nowWeekMonday: number): JobStatus {
  if (FINISHED_MARKS.has(mark.trim().toUpperCase())) return "Finished";
  const weekTime = new Date(`${weekStart}T00:00:00Z`).getTime();
  if (weekTime < nowWeekMonday) return "Overdue";
  return "Remaining";
}

/**
 * Turn raw CSV rows into the full derived dataset. Schema-agnostic: meta
 * columns are whatever non-week headers the sheet has, so newly added sheet
 * columns show up without code changes.
 */
export function transformCsv(rows: string[][], now: Date = new Date()): ScheduleData {
  if (rows.length < 2) {
    throw new Error("The published sheet returned no header rows.");
  }
  const monthRow = rows[0] ?? [];
  const headerRow = (rows[1] ?? []).map((h) => h.trim());
  const weeks = buildWeeks(monthRow, headerRow, now);
  const weekColByHeader = new Map<string, WeekInfo>();
  weeks.forEach((w) => weekColByHeader.set(w.label, w));

  // Column index per named header (first occurrence wins); unnamed columns are dropped.
  const headerIndex = new Map<string, number>();
  headerRow.forEach((h, i) => {
    if (h && !headerIndex.has(h)) headerIndex.set(h, i);
  });
  const namedHeaders = [...headerIndex.keys()];

  const dataRows = rows.slice(2).filter((r) => r.some((c) => c && c.trim() !== ""));

  const categoryField = findHeader(namedHeaders, [/categ/i, /type/i], 0);
  const instructionField = findHeader(namedHeaders, [/instruction/i, /task/i, /work/i], 1);
  const dutyField = findHeader(namedHeaders, [/duty/i, /cycle/i, /freq/i], 2);
  const siteField = findHeader(
    namedHeaders,
    [/site/i, /hall/i, /location/i],
    Math.max(0, namedHeaders.length - 5),
  );

  const nowWeekMonday = currentWeekMondayTime(now);

  const tasks: TaskRow[] = [];
  const jobs: PMJob[] = [];

  dataRows.forEach((row, rowIdx) => {
    const values: Record<string, string> = {};
    namedHeaders.forEach((h) => {
      const idx = headerIndex.get(h);
      values[h] = idx !== undefined ? (row[idx] ?? "").trim() : "";
    });
    const taskId = `task-${rowIdx}`;

    let finishedCount = 0;
    let overdue = false;
    let remaining = false;
    const taskJobs: PMJob[] = [];

    for (const week of weeks) {
      const idx = headerIndex.get(week.label);
      const mark = idx !== undefined ? (row[idx] ?? "").trim() : "";
      if (!mark) continue;
      const status = statusFor(mark, week.startDate, nowWeekMonday);
      if (status === "Finished") finishedCount++;
      else if (status === "Overdue") overdue = true;
      else remaining = true;
      taskJobs.push({
        id: `${taskId}-${week.label}`,
        taskId,
        category: values[categoryField] ?? "",
        workInstruction: values[instructionField] ?? "",
        dutyCycle: values[dutyField] ?? "",
        site: values[siteField] ?? "",
        mark,
        week,
        status,
      });
    }

    const status: JobStatus | null =
      taskJobs.length === 0
        ? null
        : overdue
          ? "Overdue"
          : remaining
            ? "Remaining"
            : "Finished";

    tasks.push({ id: taskId, values, status, jobCount: taskJobs.length, finishedCount });
    jobs.push(...taskJobs);
  });

  const columns: ColumnMeta[] = namedHeaders.map((header) => {
    const samples = dataRows.slice(0, 60).map((r) => {
      const idx = headerIndex.get(header);
      return idx !== undefined ? (r[idx] ?? "") : "";
    });
    return { header, kind: detectKind(header, samples) };
  });

  const uniqueSorted = (vals: string[]): string[] =>
    [...new Set(vals.filter((v) => v !== ""))].sort((a, b) => a.localeCompare(b));

  const monthsInOrder: string[] = [];
  for (const w of weeks) {
    const last = monthsInOrder[monthsInOrder.length - 1];
    if (w.month && w.month !== last) monthsInOrder.push(w.month);
  }

  return {
    headers: namedHeaders,
    columns,
    weeks,
    tasks,
    jobs,
    sites: uniqueSorted(jobs.map((j) => j.site)),
    categories: uniqueSorted(jobs.map((j) => j.category)),
    dutyCycles: uniqueSorted(jobs.map((j) => j.dutyCycle)),
    months: monthsInOrder,
    years: [...new Set(weeks.map((w) => w.year))].sort((a, b) => a - b),
    fields: {
      category: categoryField,
      workInstruction: instructionField,
      dutyCycle: dutyField,
      site: siteField,
    },
  };
}

export function jobMatchesFilters(job: PMJob, filters: Filters): boolean {
  if (filters.year !== "all" && job.week.year !== filters.year) return false;
  if (filters.month !== "all" && job.week.month !== filters.month) return false;
  if (filters.week !== "all" && job.week.label !== filters.week) return false;
  if (filters.site !== "all" && job.site !== filters.site) return false;
  if (filters.status !== "all" && job.status !== filters.status) return false;
  if (filters.category !== "all" && job.category !== filters.category) return false;
  if (filters.dutyCycle !== "all" && job.dutyCycle !== filters.dutyCycle) return false;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    if (
      !job.workInstruction.toLowerCase().includes(q) &&
      !job.category.toLowerCase().includes(q) &&
      !job.site.toLowerCase().includes(q) &&
      !job.dutyCycle.toLowerCase().includes(q)
    ) {
      return false;
    }
  }
  return true;
}

export function groupJobsByTask(jobs: PMJob[]): Map<string, PMJob[]> {
  const map = new Map<string, PMJob[]>();
  for (const job of jobs) {
    const list = map.get(job.taskId);
    if (list) list.push(job);
    else map.set(job.taskId, [job]);
  }
  return map;
}

/** A task row survives filtering if any of its occurrences match (or, for tasks with no schedule marks, its raw values match the non-time filters). */
export function taskMatchesFilters(task: TaskRow, taskJobs: PMJob[], filters: Filters): boolean {
  if (taskJobs.length > 0) return taskJobs.some((j) => jobMatchesFilters(j, filters));
  // Unscheduled rows: only dimension + search filters apply.
  if (
    filters.status !== "all" ||
    filters.month !== "all" ||
    filters.week !== "all" ||
    filters.year !== "all"
  ) {
    return false;
  }
  const text = Object.values(task.values).join(" ").toLowerCase();
  if (filters.search && !text.includes(filters.search.toLowerCase())) return false;
  return matchesDims(task, filters);
}

function matchesDims(task: TaskRow, filters: Filters): boolean {
  const values = Object.values(task.values).map((v) => v.trim());
  const has = (v: string | "all"): boolean => v === "all" || values.includes(v);
  return has(filters.site) && has(filters.category) && has(filters.dutyCycle);
}

export function summarize(jobs: PMJob[]): KpiSummary {
  let finished = 0;
  let remaining = 0;
  let overdue = 0;
  for (const j of jobs) {
    if (j.status === "Finished") finished++;
    else if (j.status === "Remaining") remaining++;
    else overdue++;
  }
  const total = jobs.length;
  return {
    total,
    finished,
    remaining,
    overdue,
    completionRate: total === 0 ? 0 : (finished / total) * 100,
  };
}
