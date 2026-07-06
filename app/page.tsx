"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { DashboardSkeleton } from "@/components/ui/Loading";
import { useScheduleData } from "@/hooks/useScheduleData";

// Code-split the chart-heavy dashboard; charts are client-only.
const DashboardView = dynamic(
  () => import("@/components/dashboard/DashboardView").then((m) => m.DashboardView),
  { ssr: false, loading: () => <DashboardSkeleton /> },
);

export default function DashboardPage(): ReactNode {
  const { query, refresh } = useScheduleData();

  if (query.isPending) return <DashboardSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load schedule data" message={query.error.message} onRetry={refresh} />
    );
  }
  return <DashboardView data={query.data} />;
}
