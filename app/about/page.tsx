import type { ReactNode } from "react";
import {
  CSV_URL,
  PROBLEM_CSV_URL,
  TRACKING_CSV_URL,
  PENALTY_CSV_URL,
  PENDING_CSV_URL,
} from "@/lib/constants";

export const metadata = { title: "About · CNO Dashboard" };

const SOURCES = [
  { label: "PM Schedule (fiscal-year matrix)", url: CSV_URL },
  { label: "Data Tracking", url: TRACKING_CSV_URL },
  { label: "Problem", url: PROBLEM_CSV_URL },
  { label: "Tickets Penalty", url: PENALTY_CSV_URL },
  { label: "Pending Tickets", url: PENDING_CSV_URL },
];

const PAGES = [
  {
    name: "Dashboard",
    desc: "KPI tiles, status/site charts and a Plan-vs-Actual monthly pivot table, built from the PM Schedule data.",
  },
  {
    name: "PM Schedule",
    desc: "AG Grid table of every PM task with a Finished/Remaining/Overdue chip per scheduled week.",
  },
  {
    name: "Data Tracking",
    desc: "Flat issue-tracking sheet shown as a grid, with global search.",
  },
  {
    name: "Problem",
    desc: "Flat issue-tracking sheet with an executive summary (KPI tiles, per-site cards, sub-cause table, status donut) plus site / in-out-scope / status filters, on top of the grid.",
  },
  {
    name: "Tickets Penalty",
    desc: "SLA/penalty ticket log with a summary dashboard (KPI tiles, per-site penalty table, top causes, SLA donut) and monthly pivot tables by site, SLA result and severity.",
  },
  {
    name: "Pending Tickets",
    desc: "Flat open-ticket log shown as a grid.",
  },
];

export default function AboutPage(): ReactNode {
  return (
    <div className="card mx-auto max-w-2xl space-y-4 p-6 text-sm leading-relaxed">
      <h2 className="text-lg font-bold">About CNO Dashboard</h2>
      <p className="text-secondary">
        An executive dashboard covering preventive-maintenance (PM) scheduling and related ticket
        tracking. All data is loaded live from published Google Sheets — there is no database —
        and refreshed automatically every few minutes.
      </p>
      <div>
        <h3 className="font-semibold">Pages</h3>
        <ul className="text-secondary mt-1 list-disc space-y-1 pl-5">
          {PAGES.map((p) => (
            <li key={p.name}>
              <strong>{p.name}</strong> — {p.desc}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold">How PM Schedule statuses are derived</h3>
        <ul className="text-secondary mt-1 list-disc space-y-1 pl-5">
          <li>
            A week cell marked <strong>F</strong>, <strong>DONE</strong>, <strong>C</strong> or{" "}
            <strong>OK</strong> is <strong>Finished</strong>.
          </li>
          <li>
            Any other mark in a past week is <strong>Overdue</strong>.
          </li>
          <li>
            Any other mark in the current or a future week is <strong>Remaining</strong>.
          </li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold">Data sources</h3>
        <ul className="text-secondary mt-1 space-y-1">
          {SOURCES.map((s) => (
            <li key={s.url} className="break-all">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline dark:text-accent-dark"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-muted mt-1 text-xs">
          New columns added to any sheet appear in its grid automatically — no code changes
          required.
        </p>
      </div>
      <p className="text-muted text-xs">
        Built with Next.js 15, TypeScript, Tailwind CSS, AG Grid Community, Recharts, TanStack
        Query and Framer Motion.
      </p>
    </div>
  );
}
