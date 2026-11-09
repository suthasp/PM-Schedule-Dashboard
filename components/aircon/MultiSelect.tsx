"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Show a filter box once the list is longer than this. */
  searchFrom?: number;
}

/** Checkbox dropdown: nothing ticked means All. */
export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  searchFrom = 12,
}: MultiSelectProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);

  // Close on an outside click or Escape, like a native select.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q === "" ? options : options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const summary =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? (selected[0] ?? "All")
        : `${selected.length} selected`;

  const toggle = (value: string): void => {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value],
    );
  };

  return (
    <div ref={box} className="relative flex min-w-[130px] flex-1 flex-col gap-1">
      <span className="text-muted text-xs font-medium">{label}</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`${label} filter`}
        className={`flex h-9 items-center gap-2 rounded-xl border hairline px-2 text-sm transition-colors ${
          selected.length > 0 ? "text-accent dark:text-accent-dark font-medium" : "text-secondary"
        }`}
        style={{ backgroundColor: "var(--surface)" }}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          size={15}
          aria-hidden
          className={`ml-auto shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="card absolute left-0 top-full z-30 mt-1 w-[240px] p-2 shadow-soft-lg"
          style={{ backgroundColor: "var(--surface)" }}
        >
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={() => onChange(shown)}
              className="text-accent dark:text-accent-dark rounded px-1 py-0.5 font-medium hover:underline"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
              className="text-secondary rounded px-1 py-0.5 font-medium hover:underline disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          {options.length > searchFrom && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา…"
              aria-label={`Search ${label} options`}
              className="mb-1 h-8 w-full rounded-lg border hairline px-2 text-sm outline-none focus:border-accent dark:focus:border-accent-dark"
              style={{ backgroundColor: "var(--surface)" }}
            />
          )}

          <ul className="max-h-60 overflow-auto">
            {shown.length === 0 && <li className="text-muted px-2 py-3 text-center text-xs">ไม่พบ</li>}
            {shown.map((o) => {
              const on = selected.includes(o);
              return (
                <li key={o}>
                  <button
                    type="button"
                    onClick={() => toggle(o)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        on ? "bg-accent border-accent dark:bg-accent-dark dark:border-accent-dark" : "hairline"
                      }`}
                      aria-hidden
                    >
                      {on && <Check size={12} className="text-white" />}
                    </span>
                    <span className="truncate">{o}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
