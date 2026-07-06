import type { ReactNode } from "react";
import { CSV_URL } from "@/lib/constants";

export const metadata = { title: "About · PM Schedule Dashboard" };

export default function AboutPage(): ReactNode {
  return (
    <div className="card mx-auto max-w-2xl space-y-4 p-6 text-sm leading-relaxed">
      <h2 className="text-lg font-bold">About PM Schedule Dashboard</h2>
      <p className="text-secondary">
        An executive dashboard for preventive-maintenance (PM) scheduling. Data is loaded live
        from a published Google Sheet — a fiscal-year matrix of PM tasks per site with one column
        per week — and refreshed automatically every few minutes.
      </p>
      <div>
        <h3 className="font-semibold">How statuses are derived</h3>
        <ul className="text-secondary mt-1 list-disc space-y-1 pl-5">
          <li>
            A week cell marked <strong>F</strong> is <strong>Completed</strong>.
          </li>
          <li>
            A planned mark (<strong>P</strong>) in a past week is <strong>Overdue</strong>.
          </li>
          <li>
            A planned mark in the current week is <strong>In Progress</strong>.
          </li>
          <li>
            A planned mark in a future week is <strong>Pending</strong>.
          </li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold">Data source</h3>
        <p className="text-secondary mt-1 break-all">
          <a
            href={CSV_URL}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline dark:text-accent-dark"
          >
            Published Google Sheet (CSV)
          </a>
        </p>
        <p className="text-muted mt-1 text-xs">
          New columns added to the sheet appear in the PM Schedule grid automatically — no code
          changes required.
        </p>
      </div>
      <p className="text-muted text-xs">
        Built with Next.js 15, TypeScript, Tailwind CSS, AG Grid Community, Recharts, TanStack
        Query and Framer Motion.
      </p>
    </div>
  );
}
