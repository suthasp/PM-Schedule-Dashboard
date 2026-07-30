"use client";

import { Calendar } from "lucide-react";
import type { ReactNode } from "react";

export interface DateRange {
  /** ISO yyyy-mm-dd, or "" for "from the earliest date in the data". */
  from: string;
  /** ISO yyyy-mm-dd, or "" for "to the latest date in the data". */
  to: string;
}

/** "2026-05-01" → "01/05/2026". */
function formatDmy(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

/**
 * A native `<input type="date">`, fully transparent, layered under a
 * dd/mm/yyyy-formatted label. Native date inputs render their displayed
 * format from the browser/OS locale (the `lang` attribute does not override
 * it in Chromium), so this is the only reliable way to force dd/mm/yyyy —
 * the invisible input still supplies the real calendar picker and keyboard
 * entry; only the visible text is our own formatting.
 */
function DateField({
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: {
  value: string;
  min: string;
  max: string;
  onChange: (iso: string) => void;
  ariaLabel: string;
}): ReactNode {
  return (
    <div className="relative h-9 min-w-0 flex-1">
      <input
        type="date"
        aria-label={ariaLabel}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="peer absolute inset-0 h-9 w-full cursor-pointer opacity-0"
      />
      <div
        className="pointer-events-none flex h-9 items-center justify-between rounded-xl border hairline px-2 text-sm transition-colors peer-focus:border-accent dark:peer-focus:border-accent-dark"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <span>{formatDmy(value)}</span>
        <Calendar size={14} className="text-muted" aria-hidden />
      </div>
    </div>
  );
}

function toUtcDays(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86400000);
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10);
}

/**
 * Shared thumb/track styling for the two overlaid range inputs (WebKit + Firefox).
 * Thumbs are solid accent-filled with a white ring so they read clearly against
 * both a white card (light mode) and a dark card (dark mode) — an outlined
 * white-fill thumb all but disappeared on a white background.
 */
const RANGE_INPUT =
  "pointer-events-none absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent " +
  "[&::-webkit-slider-runnable-track]:h-0 [&::-webkit-slider-runnable-track]:bg-transparent " +
  "[&::-moz-range-track]:h-0 [&::-moz-range-track]:bg-transparent " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] " +
  "[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent " +
  "[&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.45)] [&::-webkit-slider-thumb]:cursor-pointer " +
  "dark:[&::-webkit-slider-thumb]:border-surface-dark dark:[&::-webkit-slider-thumb]:bg-accent-dark " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 " +
  "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white " +
  "[&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.45)] " +
  "[&::-moz-range-thumb]:cursor-pointer dark:[&::-moz-range-thumb]:border-surface-dark dark:[&::-moz-range-thumb]:bg-accent-dark";

interface DateRangeFilterProps {
  /** Earliest / latest date (yyyy-mm-dd) present in the unfiltered data. */
  minDate: string;
  maxDate: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
}

/** Start/end date pickers plus a dual-handle slider over the data's date span. */
export function DateRangeFilter({ minDate, maxDate, value, onChange }: DateRangeFilterProps): ReactNode {
  const from = value.from || minDate;
  const to = value.to || maxDate;
  const totalDays = Math.max(1, toUtcDays(maxDate) - toUtcDays(minDate));
  const clampDay = (d: number): number => Math.min(Math.max(d, 0), totalDays);
  const startDay = clampDay(toUtcDays(from) - toUtcDays(minDate));
  const endDay = clampDay(toUtcDays(to) - toUtcDays(minDate));

  const setFrom = (iso: string): void => onChange({ from: iso > to ? to : iso, to: value.to });
  const setTo = (iso: string): void => onChange({ from: value.from, to: iso < from ? from : iso });
  const setStartDay = (day: number): void =>
    onChange({ from: addDays(minDate, Math.min(day, endDay)), to: value.to });
  const setEndDay = (day: number): void =>
    onChange({ from: value.from, to: addDays(minDate, Math.max(day, startDay)) });

  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-xs">
      <span className="text-muted font-medium">Date Range</span>
      <div className="flex items-center gap-2">
        <DateField value={from} min={minDate} max={maxDate} onChange={setFrom} ariaLabel="Start date" />
        <DateField value={to} min={minDate} max={maxDate} onChange={setTo} ariaLabel="End date" />
      </div>
      <div className="relative mt-1 h-4">
        <div className="absolute inset-x-2 top-1/2 h-1 -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/10" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-accent dark:bg-accent-dark"
          style={{ left: `${(startDay / totalDays) * 100}%`, right: `${100 - (endDay / totalDays) * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={totalDays}
          value={startDay}
          onChange={(e) => setStartDay(Number(e.target.value))}
          className={RANGE_INPUT}
          style={{ zIndex: 3 }}
          aria-label="Start date (days from earliest)"
        />
        <input
          type="range"
          min={0}
          max={totalDays}
          value={endDay}
          onChange={(e) => setEndDay(Number(e.target.value))}
          className={RANGE_INPUT}
          style={{ zIndex: 4 }}
          aria-label="End date (days from earliest)"
        />
      </div>
    </div>
  );
}
