"use client";

import type { ReactNode } from "react";
import { ErrorPage } from "@/components/ui/ErrorPage";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return <ErrorPage title="Unexpected error" message={error.message} onRetry={reset} />;
}
