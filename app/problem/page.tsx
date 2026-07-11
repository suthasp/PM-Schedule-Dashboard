"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useProblemData } from "@/hooks/useProblemData";

// AG Grid is client-only and heavy — code-split it off the main bundle.
const ProblemGridTable = dynamic(
  () => import("@/components/grid/ProblemGridTable").then((m) => m.ProblemGridTable),
  { ssr: false, loading: () => <GridSkeleton /> },
);

const ProblemSummary = dynamic(
  () => import("@/components/problem/ProblemSummary").then((m) => m.ProblemSummary),
  { ssr: false },
);

export default function ProblemPage(): ReactNode {
  const { query, refresh } = useProblemData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load problem data" message={query.error.message} onRetry={refresh} />
    );
  }
  return (
    <div className="space-y-4">
      <ProblemSummary data={query.data} />
      <ProblemGridTable data={query.data} />
    </div>
  );
}
