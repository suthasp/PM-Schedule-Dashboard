"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";
import { CATEGORICAL, CHART_INK, STATUS_COLORS } from "@/lib/constants";
import type { JobStatus } from "@/types/schedule";

interface ChartTheme {
  dark: boolean;
  ink: { primary: string; secondary: string; muted: string; grid: string };
  categorical: string[];
  statusColor: (status: JobStatus) => string;
  surface: string;
}

/** Mode-aware chart tokens from the validated reference palette. */
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";

  return useMemo(
    () => ({
      dark,
      ink: CHART_INK[dark ? "dark" : "light"],
      categorical: CATEGORICAL[dark ? "dark" : "light"],
      statusColor: (status: JobStatus) => STATUS_COLORS[status][dark ? "dark" : "light"],
      surface: dark ? "#1a1a19" : "#fcfcfb",
    }),
    [dark],
  );
}
