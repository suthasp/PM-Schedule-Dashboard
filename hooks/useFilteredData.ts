"use client";

import { useMemo } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import type { Filters, KpiSummary, PMJob, ScheduleData, TaskRow } from "@/types/schedule";
import {
  groupJobsByTask,
  jobMatchesFilters,
  summarize,
  taskMatchesFilters,
} from "@/utils/transform";

interface FilteredData {
  jobs: PMJob[];
  tasks: TaskRow[];
  kpis: KpiSummary;
}

/**
 * Applies the shared global filters to the derived dataset, memoized.
 * Pass `override` to filter with a page-local state instead.
 */
export function useFilteredData(
  data: ScheduleData | undefined,
  override?: Filters,
): FilteredData {
  const { filters: global } = useFilters();
  const filters = override ?? global;

  return useMemo(() => {
    if (!data) {
      return { jobs: [], tasks: [], kpis: summarize([]) };
    }
    const byTask = groupJobsByTask(data.jobs);
    const jobs = data.jobs.filter((j) => jobMatchesFilters(j, filters));
    const tasks = data.tasks.filter((t) => taskMatchesFilters(t, byTask.get(t.id) ?? [], filters));
    return { jobs, tasks, kpis: summarize(jobs) };
  }, [data, filters]);
}
