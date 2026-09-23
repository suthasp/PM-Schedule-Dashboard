"use client";

import { useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { CAPEX_QUERY_KEY } from "@/lib/constants";
import { fetchCapexData } from "@/services/capexService";
import type { ProblemData } from "@/types/problem";

interface CapexQuery {
  query: UseQueryResult<ProblemData, Error>;
  refresh: () => void;
}

/** Loads the CAPEX 2026 sheet CSV and re-fetches on the configured interval. */
export function useCapexData(): CapexQuery {
  const { settings } = useSettings();
  const queryClient = useQueryClient();

  const query = useQuery<ProblemData, Error>({
    queryKey: CAPEX_QUERY_KEY,
    queryFn: fetchCapexData,
    refetchInterval: settings.autoRefresh ? settings.refreshMinutes * 60_000 : false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CAPEX_QUERY_KEY });
  }, [queryClient]);

  return { query, refresh };
}
