"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { PENDING_QUERY_KEY } from "@/lib/constants";
import { fetchPendingData } from "@/services/pendingService";
import type { ProblemData } from "@/types/problem";

interface PendingQuery {
  query: UseQueryResult<ProblemData, Error>;
  refresh: () => void;
}

/** Loads the Pending Ticket sheet CSV and re-fetches on the configured interval. */
export function usePendingData(): PendingQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ProblemData, Error>({
    queryKey: PENDING_QUERY_KEY,
    queryFn: fetchPendingData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: PENDING_QUERY_KEY });
  }, [queryClient]);

  return { query, refresh };
}
