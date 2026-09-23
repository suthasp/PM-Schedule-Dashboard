"use client";

import type { ReactNode } from "react";
import { SheetColumnsView } from "@/components/sheet/SheetColumnsView";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useCapexData } from "@/hooks/useCapexData";
import { LS_KEYS } from "@/lib/constants";

/** Sheet positions B, C, D, I, J, O, P, T, AG. */
const COLUMN_INDEXES = [1, 2, 3, 8, 9, 14, 15, 19, 32];

const COLUMN_LABELS = [
  "Record Reference Code",
  "Last Status",
  "Request Date",
  "Description",
  "Site Name",
  "Requested Amount (Bt)",
  "Link เอกสาร",
  "Vendor",
  "Reject Detail",
];

export default function CapexPage(): ReactNode {
  const { query, refresh } = useCapexData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load CAPEX data" message={query.error.message} onRetry={refresh} />
    );
  }
  return (
    <SheetColumnsView
      data={query.data}
      columnIndexes={COLUMN_INDEXES}
      columnLabels={COLUMN_LABELS}
      storageKeyBase={LS_KEYS.capexGridColumnState}
    />
  );
}
