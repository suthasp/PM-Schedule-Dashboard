"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { useSettings } from "@/components/providers/SettingsProvider";
import { ChartCard } from "@/components/ui/ChartCard";

const INTERVALS = [1, 2, 5, 10, 15, 30, 60] as const;
const THEMES = ["light", "dark", "system"] as const;

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b hairline py-4 last:border-b-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-muted text-xs">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage(): ReactNode {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selectClass =
    "h-9 rounded-xl border hairline bg-transparent px-2.5 text-sm outline-none focus:border-accent dark:focus:border-accent-dark";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ChartCard title="Data Refresh" subtitle="How often the Google Sheet is re-fetched">
        <Row label="Auto refresh" hint="Re-fetch the published CSV in the background">
          <input
            type="checkbox"
            checked={settings.autoRefresh}
            onChange={(e) => updateSettings({ autoRefresh: e.target.checked })}
            className="h-5 w-5 accent-[color:var(--accent)]"
            aria-label="Toggle auto refresh"
          />
        </Row>
        <Row label="Refresh interval">
          <select
            value={settings.refreshMinutes}
            onChange={(e) => updateSettings({ refreshMinutes: Number(e.target.value) })}
            disabled={!settings.autoRefresh}
            className={`${selectClass} disabled:opacity-40`}
            style={{ backgroundColor: "var(--surface)" }}
            aria-label="Refresh interval"
          >
            {INTERVALS.map((m) => (
              <option key={m} value={m}>
                Every {m} minute{m > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </Row>
      </ChartCard>

      <ChartCard title="Appearance">
        <Row label="Theme">
          {mounted ? (
            <div className="flex gap-1 rounded-xl border hairline p-1">
              {THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm capitalize transition-colors ${
                    theme === t
                      ? "bg-accent text-white dark:bg-accent-dark"
                      : "text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <span className="h-9" />
          )}
        </Row>
      </ChartCard>

      <ChartCard title="Export Preferences">
        <Row label="File name prefix" hint="Used for CSV exports and screenshots">
          <input
            type="text"
            value={settings.exportFilePrefix}
            onChange={(e) => updateSettings({ exportFilePrefix: e.target.value || "pm-schedule" })}
            className={`${selectClass} w-48`}
            style={{ backgroundColor: "var(--surface)" }}
            aria-label="Export file name prefix"
          />
        </Row>
        <Row label="Export visible columns only" hint="Unchecked exports every column, including hidden ones">
          <input
            type="checkbox"
            checked={settings.exportVisibleColumnsOnly}
            onChange={(e) => updateSettings({ exportVisibleColumnsOnly: e.target.checked })}
            className="h-5 w-5 accent-[color:var(--accent)]"
            aria-label="Export visible columns only"
          />
        </Row>
      </ChartCard>

      <button
        type="button"
        onClick={resetSettings}
        className="rounded-xl border hairline px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        Reset to defaults
      </button>
    </div>
  );
}
