"use client";

import { useMemo } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import type { KpiSummary, PMJob, ScheduleData, TaskRow } from "@/types/schedule";
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

/** Applies the shared global filters to the derived dataset, memoized. */
export function useFilteredData(data: ScheduleData | undefined): FilteredData {
  const { filters } = useFilters();

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
