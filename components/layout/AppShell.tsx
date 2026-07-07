"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { LS_KEYS } from "@/lib/constants";

export function AppShell({ children }: { children: ReactNode }): ReactNode {
  // Mobile: overlay drawer. Desktop: collapse to an icon rail (persisted).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(LS_KEYS.sidebarCollapsed) === "1");
    } catch {
      // storage unavailable — start expanded
    }
  }, []);

  const onMenuClick = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setCollapsed((prev) => {
        const next = !prev;
        try {
          window.localStorage.setItem(LS_KEYS.sidebarCollapsed, next ? "1" : "0");
        } catch {
          // ignore
        }
        return next;
      });
    } else {
      setSidebarOpen((v) => !v);
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={onMenuClick} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
