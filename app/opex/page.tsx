"use client";

import type { ReactNode } from "react";
import { SheetColumnsView } from "@/components/sheet/SheetColumnsView";
import { ErrorPage } from "@/components/ui/ErrorPage";
import { GridSkeleton } from "@/components/ui/Loading";
import { useOpexData } from "@/hooks/useOpexData";
import { LS_KEYS } from "@/lib/constants";

/** Sheet positions B, E, J, S, T, X, Y, AB, AC. */
const COLUMN_INDEXES = [1, 4, 9, 18, 19, 23, 24, 27, 28];

const COLUMN_LABELS = [
  "Record Reference Code",
  "OPEX Last Status",
  "Record Date",
  "Description รายละเอียดค่าใช้จ่าย",
  "Amount (Bt)",
  "BU",
  "Vendor",
  "สถานะของงาน",
  "Link เอกสาร",
];

export default function OpexPage(): ReactNode {
  const { query, refresh } = useOpexData();

  if (query.isPending) return <GridSkeleton />;
  if (query.isError) {
    return (
      <ErrorPage title="Could not load OPEX data" message={query.error.message} onRetry={refresh} />
    );
  }
  return (
    <SheetColumnsView
      data={query.data}
      columnIndexes={COLUMN_INDEXES}
      columnLabels={COLUMN_LABELS}
      sortByIndex={1}
      summary={{ statusIndex: 4, amountIndex: 19, buIndex: 23, buLabel: "BU" }}
      storageKeyBase={LS_KEYS.opexGridColumnState}
    />
  );
}
