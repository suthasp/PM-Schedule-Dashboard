"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { OPEX_QUERY_KEY } from "@/lib/constants";
import { fetchOpexData } from "@/services/opexService";
import type { ProblemData } from "@/types/problem";

interface OpexQuery {
  query: UseQueryResult<ProblemData, Error>;
  refresh: () => void;
}

/** Loads the OPEX 2026 sheet CSV and re-fetches on the configured interval. */
export function useOpexData(): OpexQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ProblemData, Error>({
    queryKey: OPEX_QUERY_KEY,
    queryFn: fetchOpexData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: OPEX_QUERY_KEY });
  }, [queryClient]);

  return { query, refresh };
}
