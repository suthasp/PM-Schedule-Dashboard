"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className = "",
}: ChartCardProps): ReactNode {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`card flex flex-col p-4 md:p-5 ${className}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle ? <p className="text-muted mt-0.5 text-xs">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </motion.section>
  );
}
