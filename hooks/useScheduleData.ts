"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { DATA_QUERY_KEY } from "@/lib/constants";
import { fetchScheduleData } from "@/services/scheduleService";
import type { ScheduleData } from "@/types/schedule";

interface ScheduleQuery {
  query: UseQueryResult<ScheduleData, Error>;
  /** Timestamp (ms) of the last successful fetch. */
  lastUpdated: number | undefined;
  refresh: () => void;
}

/** Loads the Google Sheet CSV and re-fetches on the configured interval. */
export function useScheduleData(): ScheduleQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ScheduleData, Error>({
    queryKey: DATA_QUERY_KEY,
    queryFn: fetchScheduleData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: DATA_QUERY_KEY });
  }, [queryClient]);

  return { query, lastUpdated: query.dataUpdatedAt || undefined, refresh };
}
