"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, LayoutDashboard, Settings, Table2, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "PM Schedule", icon: Table2 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
] as const;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }): ReactNode {
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
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent dark:bg-accent-dark/15 dark:text-accent-dark"
                : "text-secondary hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <Icon size={18} strokeWidth={2} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ open, onClose }: SidebarProps): ReactNode {
  const brand = (
    <div className="flex items-center gap-2.5 px-6 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white dark:bg-accent-dark">
        <Wrench size={18} aria-hidden />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-bold">PM Schedule</p>
        <p className="text-muted text-xs">Maintenance Ops</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r lg:flex"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--hairline)" }}
      >
        {brand}
        <NavLinks />
      </aside>

      {/* Mobile drawer */}
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
              {brand}
              <NavLinks onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
