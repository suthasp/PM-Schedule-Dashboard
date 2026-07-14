"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { TRACKING_QUERY_KEY } from "@/lib/constants";
import { fetchTrackingData } from "@/services/trackingService";
import type { ProblemData } from "@/types/problem";

interface TrackingQuery {
  query: UseQueryResult<ProblemData, Error>;
  refresh: () => void;
}

/** Loads the Data Tracking sheet CSV and re-fetches on the configured interval. */
export function useTrackingData(): TrackingQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ProblemData, Error>({
    queryKey: TRACKING_QUERY_KEY,
    queryFn: fetchTrackingData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TRACKING_QUERY_KEY });
  }, [queryClient]);

  return { query, refresh };
}
