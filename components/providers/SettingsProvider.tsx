"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_REFRESH_MINUTES, LS_KEYS } from "@/lib/constants";

export interface AppSettings {
  autoRefresh: boolean;
  /** Refresh interval in minutes. */
  refreshMinutes: number;
  /** Filename prefix used for CSV / screenshot exports. */
  exportFilePrefix: string;
  /** Export only the columns currently visible in the grid. */
  exportVisibleColumnsOnly: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoRefresh: true,
  refreshMinutes: DEFAULT_REFRESH_MINUTES,
  exportFilePrefix: "pm-schedule",
  exportVisibleColumnsOnly: true,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }): ReactNode {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LS_KEYS.settings);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) });
    } catch {
      // corrupted storage — fall back to defaults
    }
  }, []);

  const persist = useCallback((next: AppSettings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(LS_KEYS.settings, JSON.stringify(next));
    } catch {
      // storage unavailable (private mode) — keep in-memory settings
    }
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      persist({ ...settings, ...patch });
    },
    [persist, settings],
  );

  const resetSettings = useCallback(() => persist(DEFAULT_SETTINGS), [persist]);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
