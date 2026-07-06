"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

interface ErrorPageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorPage({ title = "Something went wrong", message, onRetry }: ErrorPageProps): ReactNode {
  return (
    <div className="card mx-auto mt-16 flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-overdue/10 text-status-overdue">
        <AlertTriangle size={24} aria-hidden />
      </span>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-secondary mt-1 text-sm">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-accent-dark"
        >
          <RefreshCw size={15} aria-hidden />
          Try again
        </button>
      ) : null}
    </div>
  );
}
