"use client";

import { Fragment, useMemo, type ReactNode } from "react";
import { useChartTheme } from "@/hooks/useChartTheme";
import { SITE_COMPLETION, STATUS_COLORS } from "@/lib/constants";
import type { PMJob, ScheduleData, TaskRow } from "@/types/schedule";
import { formatNumber, formatPercent } from "@/utils/format";

interface PivotLeaf {
  task: string;
  plan: number;
  actual: number;
}

interface PivotGroup {
  duty: string;
  leaves: PivotLeaf[];
  plan: number;
  actual: number;
}

/**
 * Duty cycle → task roll-up. Rows come from the task list rather than the
 * jobs, so a task that exists in the sheet but has no marks this year still
 * shows up with a zero — the same way the spreadsheet's pivot reports it.
 */
function buildPivot(tasks: TaskRow[], jobs: PMJob[], fields: ScheduleData["fields"]): PivotGroup[] {
  const groups = new Map<string, Map<string, PivotLeaf>>();

  const leafFor = (duty: string, task: string): PivotLeaf => {
    const byTask = groups.get(duty) ?? new Map<string, PivotLeaf>();
    const leaf = byTask.get(task) ?? { task, plan: 0, actual: 0 };
    byTask.set(task, leaf);
    groups.set(duty, byTask);
    return leaf;
  };

  for (const t of tasks) {
    const duty = (t.values[fields.dutyCycle] ?? "").trim();
    const task = (t.values[fields.workInstruction] ?? "").trim();
    if (duty === "" && task === "") continue;
    leafFor(duty || "—", task || "—");
  }
  for (const job of jobs) {
    const leaf = leafFor(job.dutyCycle || "—", job.workInstruction || "—");
    leaf.plan++;
    if (job.status === "Finished") leaf.actual++;
  }

  return [...groups.entries()]
    .map(([duty, byTask]) => {
      const leaves = [...byTask.values()].sort((a, b) => a.task.localeCompare(b.task));
      return {
        duty,
        leaves,
        plan: leaves.reduce((s, l) => s + l.plan, 0),
        actual: leaves.reduce((s, l) => s + l.actual, 0),
      };
    })
    .sort((a, b) => a.duty.localeCompare(b.duty, undefined, { numeric: true }));
}

const hairline = { borderColor: "var(--hairline)" } as const;

/** Plan / Actual / Remain by maintenance cycle and task. */
export function AmcDutyCyclePivot({
  data,
  tasks,
  jobs,
}: {
  data: ScheduleData;
  tasks: TaskRow[];
  jobs: PMJob[];
}): ReactNode {
  const { dark } = useChartTheme();
  const overdue = STATUS_COLORS.Overdue[dark ? "dark" : "light"];
  const groups = useMemo(() => buildPivot(tasks, jobs, data.fields), [tasks, jobs, data.fields]);

  const total = useMemo(() => {
    const plan = groups.reduce((s, g) => s + g.plan, 0);
    const actual = groups.reduce((s, g) => s + g.actual, 0);
    return { plan, actual };
  }, [groups]);

  if (groups.length === 0) {
    return <p className="text-muted py-8 text-center text-sm">No jobs match the current filters.</p>;
  }

  const headerCell = "whitespace-nowrap border px-2 py-1.5 text-xs font-bold";
  const cell = "border px-2 py-1 text-right tabular-nums";

  /** Nothing planned means there is no rate to report — a red 0% would mislead. */
  const pctCell = (plan: number, actual: number, bold: boolean): ReactNode => {
    if (plan === 0) {
      return (
        <td className={`${cell} text-muted`} style={hairline}>
          –
        </td>
      );
    }
    const pct = (actual / plan) * 100;
    return (
      <td
        className={`${cell} ${bold ? "font-bold" : "font-semibold"}`}
        style={{ ...hairline, color: pct === 0 ? overdue : undefined }}
      >
        {formatPercent(pct)}
      </td>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr
            style={{ backgroundColor: SITE_COMPLETION.header.bg, color: SITE_COMPLETION.header.fg }}
          >
            <th className={`${headerCell} text-left`} style={hairline}>
              Duty Cycle
            </th>
            <th className={`${headerCell} text-left`} style={hairline}>
              Task
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              Sum of Plan
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              Sum of Actual
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              Sum of Remain
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              % Completed
            </th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.duty}>
              <tr style={{ backgroundColor: SITE_COMPLETION.totalTint }}>
                <td className="whitespace-nowrap border px-2 py-1 font-bold" style={hairline}>
                  {g.duty}
                </td>
                <td className="border px-2 py-1" style={hairline} />
                <td className={`${cell} font-bold`} style={hairline}>
                  {formatNumber(g.plan)}
                </td>
                <td className={`${cell} font-bold`} style={hairline}>
                  {formatNumber(g.actual)}
                </td>
                <td className={`${cell} font-bold`} style={hairline}>
                  {formatNumber(g.plan - g.actual)}
                </td>
                {pctCell(g.plan, g.actual, true)}
              </tr>
              {g.leaves.map((l) => (
                <tr key={`${g.duty}-${l.task}`}>
                  <td className="border px-2 py-1" style={hairline} />
                  <td className="border py-1 pl-5 pr-2" style={hairline}>
                    {l.task}
                  </td>
                  <td className={cell} style={hairline}>
                    {formatNumber(l.plan)}
                  </td>
                  <td className={cell} style={hairline}>
                    {formatNumber(l.actual)}
                  </td>
                  <td className={cell} style={hairline}>
                    {formatNumber(l.plan - l.actual)}
                  </td>
                  {pctCell(l.plan, l.actual, false)}
                </tr>
              ))}
            </Fragment>
          ))}
          <tr
            style={{ backgroundColor: SITE_COMPLETION.header.bg, color: SITE_COMPLETION.header.fg }}
          >
            <td className="border px-2 py-1.5 font-bold" colSpan={2} style={hairline}>
              Grand Total
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatNumber(total.plan)}
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatNumber(total.actual)}
            </td>
            <td className={`${cell} font-bold`} style={hairline}>
              {formatNumber(total.plan - total.actual)}
            </td>
            {pctCell(total.plan, total.actual, true)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
