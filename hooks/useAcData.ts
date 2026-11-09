"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { AC_CM_QUERY_KEY, AC_PM_QUERY_KEY } from "@/lib/constants";
import { fetchAcCorrectiveData, fetchAcPreventiveData } from "@/services/acService";
import type { ProblemData } from "@/types/problem";

interface AcQuery {
  query: UseQueryResult<ProblemData, Error>;
  refresh: () => void;
}

function useSheet(
  key: readonly string[],
  queryFn: () => Promise<ProblemData>,
): AcQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ProblemData, Error>({
    queryKey: key,
    queryFn,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient, key]);

  return { query, refresh };
}

/** Loads the AMC Air Condition Preventive sheet on the configured interval. */
export function useAcPreventiveData(): AcQuery {
  return useSheet(AC_PM_QUERY_KEY, fetchAcPreventiveData);
}

/** Loads the AMC Air Condition Corrective sheet on the configured interval. */
export function useAcCorrectiveData(): AcQuery {
  return useSheet(AC_CM_QUERY_KEY, fetchAcCorrectiveData);
}
