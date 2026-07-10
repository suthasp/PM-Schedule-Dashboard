"use client";

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { Menu, Moon, RefreshCw, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useFilters } from "@/components/providers/FilterProvider";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useScheduleData } from "@/hooks/useScheduleData";
import { formatClock, formatRelative } from "@/utils/format";

function ThemeToggle(): ReactNode {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="h-9 w-9" />;
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-xl border hairline transition-colors hover:bg-black/5 dark:hover:bg-white/5"
    >
      {dark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}

export function Header({ onMenuClick }: { onMenuClick: () => void }): ReactNode {
  const now = useCurrentTime();
  const { lastUpdated } = useScheduleData();
  const { filters, setFilter } = useFilters();

  // Refresh every dataset (PM schedule + Problem), not just the schedule query.
  const queryClient = useQueryClient();
  const fetching = useIsFetching() > 0;
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  return (
    <header className="glass no-print sticky top-0 z-30 flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
      <button
        type="button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border hairline transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        <Menu size={18} aria-hidden />
      </button>

      <h1 className="text-base font-bold tracking-tight md:text-lg">PM Schedule Dashboard</h1>

      <div className="relative ml-auto w-full max-w-xs sm:w-56 md:w-72">
        <Search
          size={15}
          aria-hidden
          className="text-muted pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
        />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="Search entire dataset…"
          aria-label="Global search"
          className="h-9 w-full rounded-xl border hairline bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-[color:var(--ink-muted)] focus:border-accent dark:focus:border-accent-dark"
        />
      </div>

      <div className="text-muted hidden flex-col items-end text-[11px] leading-tight md:flex">
        <span suppressHydrationWarning className="font-medium tabular-nums text-secondary">
          {now ? formatClock(now) : "—"}
        </span>
        <span suppressHydrationWarning>
          Updated {lastUpdated ? formatRelative(lastUpdated, now ?? new Date()) : "…"}
        </span>
      </div>

      <button
        type="button"
        aria-label="Refresh data"
        onClick={refresh}
        disabled={fetching}
        className="flex h-9 w-9 items-center justify-center rounded-xl border hairline transition-colors hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
      >
        <RefreshCw size={16} className={fetching ? "animate-spin" : ""} aria-hidden />
      </button>

      <ThemeToggle />
    </header>
  );
}
