"use client";

import { useEffect, useState } from "react";

/** Ticking clock; returns null until mounted to avoid hydration mismatch. */
export function useCurrentTime(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
