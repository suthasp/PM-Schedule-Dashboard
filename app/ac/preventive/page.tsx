"use client";

import type { ReactNode } from "react";
import { AirconView } from "@/components/aircon/AirconView";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useAcPreventiveData } from "@/hooks/useAcData";
import { LS_KEYS } from "@/lib/constants";

export default function AcPreventivePage(): ReactNode {
  const { query, refresh } = useAcPreventiveData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage
        title="Could not load Preventive data"
        message={query.error.message}
        onRetry={refresh}
      />
    );
  }
  return (
    <AirconView
      data={query.data}
      kind="PM"
      storageKeyBase={LS_KEYS.acPmGridColumnState}
      exportName="AC-Preventive"
    />
  );
}
