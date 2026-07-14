"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useTrackingData } from "@/hooks/useTrackingData";
import { LS_KEYS } from "@/lib/constants";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

export default function TrackingPage(): ReactNode {
  const { query, refresh } = useTrackingData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load tracking data" message={query.error.message} onRetry={refresh} />
    );
  }
  return (
    <ProblemGridTable
      data={query.data}
      storageKeyBase={LS_KEYS.trackingGridColumnState}
      itemLabel="records"
      autoSizeOnLoad
    />
  );
}
