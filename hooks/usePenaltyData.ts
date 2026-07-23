"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { PENALTY_QUERY_KEY } from "@/lib/constants";
import { fetchPenaltyData } from "@/services/penaltyService";
import type { ProblemData } from "@/types/problem";

interface PenaltyQuery {
  query: UseQueryResult<ProblemData, Error>;
  refresh: () => void;
}

/** Loads the Tickets Penalty sheet CSV and re-fetches on the configured interval. */
export function usePenaltyData(): PenaltyQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ProblemData, Error>({
    queryKey: PENALTY_QUERY_KEY,
    queryFn: fetchPenaltyData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PENALTY_QUERY_KEY });
  }, [queryClient]);

  return { query, refresh };
}
