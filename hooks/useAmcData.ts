"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { AMC_QUERY_KEY } from "@/lib/constants";
import { fetchAmcData } from "@/services/amcService";
import type { ScheduleData } from "@/types/schedule";

interface AmcQuery {
  query: UseQueryResult<ScheduleData, Error>;
  refresh: () => void;
}

/** Loads the AMC Actual sheet CSV and re-fetches on the configured interval. */
export function useAmcData(): AmcQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ScheduleData, Error>({
    queryKey: AMC_QUERY_KEY,
    queryFn: fetchAmcData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: AMC_QUERY_KEY });
  }, [queryClient]);

  return { query, refresh };
}
