"use client";

import type { ReactNode } from "react";
import { AirconView } from "@/components/aircon/AirconView";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useAcCorrectiveData } from "@/hooks/useAcData";
import { LS_KEYS } from "@/lib/constants";

export default function AcCorrectivePage(): ReactNode {
  const { query, refresh } = useAcCorrectiveData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage
        title="Could not load Corrective data"
        message={query.error.message}
        onRetry={refresh}
      />
    );
  }
  return (
    <AirconView
      data={query.data}
      kind="CM"
      storageKeyBase={LS_KEYS.acCmGridColumnState}
      exportName="AC-Corrective"
    />
  );
}
