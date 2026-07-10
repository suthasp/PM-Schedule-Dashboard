"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { PROBLEM_QUERY_KEY } from "@/lib/constants";
import { fetchProblemData } from "@/services/problemService";
import type { ProblemData } from "@/types/problem";

interface ProblemQuery {
  query: UseQueryResult<ProblemData, Error>;
  refresh: () => void;
}

/** Loads the Problem sheet CSV and re-fetches on the configured interval. */
export function useProblemData(): ProblemQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ProblemData, Error>({
    queryKey: PROBLEM_QUERY_KEY,
    queryFn: fetchProblemData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PROBLEM_QUERY_KEY });
  }, [queryClient]);

  return { query, refresh };
}
