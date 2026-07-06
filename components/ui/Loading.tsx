import type { ReactNode } from "react";

export function Skeleton({ className = "" }: { className?: string }): ReactNode {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Full dashboard loading skeleton: KPI row + chart grid. */
export function DashboardSkeleton(): ReactNode {
  return (
    <div className="space-y-4" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
      <Skeleton className="h-44 w-full" />
    </div>
  );
}

export function GridSkeleton(): ReactNode {
  return (
    <div className="space-y-3" role="status" aria-label="Loading schedule">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[62vh] w-full" />
    </div>
  );
}
