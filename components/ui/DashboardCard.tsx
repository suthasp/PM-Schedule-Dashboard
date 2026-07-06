"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface DashboardCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Accent color for the icon chip (hex). */
  color: string;
  active?: boolean;
  onClick?: () => void;
  sub?: string;
}

/** KPI stat tile. Clickable tiles toggle the matching global filter. */
export function DashboardCard({
  label,
  value,
  icon: Icon,
  color,
  active = false,
  onClick,
  sub,
}: DashboardCardProps): ReactNode {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.25 }}
      aria-pressed={onClick ? active : undefined}
      className={`card flex w-full items-center gap-3 p-4 text-left transition-shadow ${
        onClick ? "cursor-pointer hover:shadow-soft-lg" : "cursor-default"
      } ${active ? "ring-2 ring-accent dark:ring-accent-dark" : ""}`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1a`, color }}
      >
        <Icon size={19} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="text-muted block truncate text-xs font-medium">{label}</span>
        <span className="block text-xl font-bold leading-tight">{value}</span>
        {sub ? <span className="text-muted block text-[11px]">{sub}</span> : null}
      </span>
    </motion.button>
  );
}
