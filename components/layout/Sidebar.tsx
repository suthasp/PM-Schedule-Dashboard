"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AirVent,
  AlertTriangle,
  Banknote,
  ChevronDown,
  Hourglass,
  Info,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wallet,
  Table2,
  Ticket,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Expandable sub-menu; the parent itself is then not a link. */
  children?: { href: string; label: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/schedule", label: "PM Schedule", icon: Table2 },
  { href: "/tracking", label: "Data Tracking", icon: Activity },
  { href: "/problem", label: "Problem", icon: AlertTriangle },
  { href: "/amc", label: "AMC Actual", icon: ShieldCheck },
  {
    href: "/ac",
    label: "AMC Air Condition",
    icon: AirVent,
    children: [
      { href: "/ac/preventive", label: "Preventive" },
      { href: "/ac/corrective", label: "Corrective" },
    ],
  },
  { href: "/penalty", label: "Tickets Penalty", icon: Ticket },
  { href: "/pending", label: "Pending Tickets", icon: Hourglass },
  { href: "/opex", label: "OPEX2026", icon: Wallet },
  { href: "/capex", label: "CAPEX2026", icon: Banknote },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  /** Desktop icon-rail mode (toggled by the header hamburger). */
  collapsed?: boolean;
}

const rowBase = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors";
const activeRow = "bg-accent/10 text-accent dark:bg-accent-dark/15 dark:text-accent-dark";
const idleRow = "text-secondary hover:bg-black/5 dark:hover:bg-white/5";

/** A nav entry that expands to reveal its sub-pages. */
function NavGroup({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}): ReactNode {
  const pathname = usePathname();
  const children = item.children ?? [];
  const inSection = pathname.startsWith(`${item.href}/`);
  // Opens itself when one of its pages is showing, and stays user-togglable.
  const [open, setOpen] = useState(inSection);
  const expanded = open || inSection;
  const Icon = item.icon;

  // On the icon rail there is no room for a sub-list: link straight to the
  // first page and let the tooltip name the section.
  if (collapsed) {
    return (
      <Link
        href={children[0]?.href ?? item.href}
        onClick={onNavigate}
        title={item.label}
        aria-label={item.label}
        className={`${rowBase} justify-center px-0 ${inSection ? activeRow : idleRow}`}
      >
        <Icon size={18} strokeWidth={2} className="shrink-0" aria-hidden />
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!expanded)}
        aria-expanded={expanded}
        className={`${rowBase} w-full ${inSection ? activeRow : idleRow}`}
      >
        <Icon size={18} strokeWidth={2} className="shrink-0" aria-hidden />
        <span className="truncate">{item.label}</span>
        <ChevronDown
          size={15}
          aria-hidden
          className={`ml-auto shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="mt-1 flex flex-col gap-1 pl-7">
          {children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === child.href ? activeRow : idleRow
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
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
    <nav className="flex flex-col gap-1 overflow-y-auto px-3 pb-4">
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          return (
            <NavGroup
              key={item.href}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          );
        }
        const { href, label, icon: Icon } = item;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            aria-label={label}
            className={`${rowBase} ${collapsed ? "justify-center px-0" : ""} ${
              active ? activeRow : idleRow
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
