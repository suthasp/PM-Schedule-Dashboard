"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useAmcData } from "@/hooks/useAmcData";
import { LS_KEYS } from "@/lib/constants";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const AGGridTable = dynamic(
  () => import("@/components/grid/AGGridTable").then((m) => m.AGGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

export default function AmcPage(): ReactNode {
  const { query, refresh } = useAmcData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return <ErrorPage title="Could not load AMC data" message={query.error.message} onRetry={refresh} />;
  }
  // Own sheet, own page — it does not join the global dimension filters.
  return (
    <AGGridTable
      data={query.data}
      tasks={query.data.tasks}
      storageKeyBase={LS_KEYS.amcGridColumnState}
    />
  );
}
