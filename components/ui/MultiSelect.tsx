"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}

/** Checkbox dropdown for selecting zero or more values; empty selection reads as "All". */
export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps): ReactNode {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const toggle = (value: string): void => {
    onChange(selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value]);
  };

  const summary =
    selected.length === 0 ? "All" : selected.length === 1 ? selected[0] : `${selected.length} selected`;

  return (
    <div ref={rootRef} className="relative flex min-w-0 flex-col gap-1 text-xs">
      <span className="text-muted font-medium">{label}</span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-9 items-center justify-between gap-1 rounded-xl border hairline bg-transparent px-2.5 text-left text-sm outline-none transition-colors focus:border-accent dark:focus:border-accent-dark"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown size={14} className="text-muted shrink-0" aria-hidden />
      </button>
      {open && (
        <div className="card absolute left-0 top-full z-20 mt-1 max-h-64 w-56 overflow-y-auto p-1.5 shadow-soft-lg">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
            <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} />
            All
          </label>
          <div className="my-1 border-t hairline" />
          {options.map((o) => (
            <label
              key={o}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} />
              <span className="truncate">{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
