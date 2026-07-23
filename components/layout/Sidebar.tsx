"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Hourglass,
  Info,
  LayoutDashboard,
  Settings,
  Table2,
  Ticket,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "PM Schedule", icon: Table2 },
  { href: "/tracking", label: "Data Tracking", icon: Activity },
  { href: "/problem", label: "Problem", icon: AlertTriangle },
  { href: "/penalty", label: "Tickets Penalty", icon: Ticket },
  { href: "/pending", label: "Pending Ticket", icon: Hourglass },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  /** Desktop icon-rail mode (toggled by the header hamburger). */
  collapsed?: boolean;
}

function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}): ReactNode {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            aria-label={label}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              collapsed ? "justify-center px-0" : ""
            } ${
              active
                ? "bg-accent/10 text-accent dark:bg-accent-dark/15 dark:text-accent-dark"
                : "text-secondary hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Icon size={18} strokeWidth={2} className="shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed = false }: { collapsed?: boolean }): ReactNode {
  return (
    <div className={`flex items-center gap-2.5 py-5 ${collapsed ? "justify-center px-0" : "px-6"}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white dark:bg-accent-dark">
        <Wrench size={18} aria-hidden />
      </span>
      {!collapsed && (
        <div className="leading-tight">
          <p className="whitespace-nowrap text-sm font-bold">CNO Dashboard</p>
          <p className="text-muted whitespace-nowrap text-xs">Maintenance Ops</p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ open, onClose, collapsed = false }: SidebarProps): ReactNode {
  return (
    <>
      {/* Desktop sidebar: full rail or icon rail */}
      <aside
        className={`no-print sticky top-0 hidden h-screen shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 ease-out lg:flex ${
          collapsed ? "w-[68px]" : "w-60"
        }`}
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--hairline)" }}
      >
        <Brand collapsed={collapsed} />
        <NavLinks collapsed={collapsed} />
      </aside>

      {/* Mobile drawer (always full width when open) */}
      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="no-print fixed inset-0 z-40 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="no-print fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r lg:hidden"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--hairline)" }}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "tween", duration: 0.2 }}
            >
              <Brand />
              <NavLinks onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
