"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { usePenaltyData } from "@/hooks/usePenaltyData";
import { LS_KEYS } from "@/lib/constants";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

const PenaltySummary = dynamic(
  () => import("@/components/penalty/PenaltySummary").then((m) => m.PenaltySummary),
  { ssr: false },
);

export default function PenaltyPage(): ReactNode {
  const { query, refresh } = usePenaltyData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load penalty data" message={query.error.message} onRetry={refresh} />
    );
  }
  return (
    <div className="space-y-4">
      <PenaltySummary data={query.data} />
      <ProblemGridTable
        data={query.data}
        storageKeyBase={LS_KEYS.penaltyGridColumnState}
        itemLabel="tickets"
        autoSizeOnLoad
      />
    </div>
  );
}
