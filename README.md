# CNO Dashboard

Executive dashboard for preventive-maintenance scheduling, driven live from a published
Google Sheet (fiscal-year PM matrix: one task per row, one column per week).

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## How it works

- The published Google Sheet CSV is fetched through a local API proxy
  (`app/api/schedule/route.ts`) and parsed client-side with PapaParse.
- Data auto-refreshes every 5 minutes (configurable in **Settings**).
- The sheet's two header rows (months + `WK##` week columns) are parsed into a
  fiscal-year timeline. Each non-empty week cell becomes one **PM job occurrence**:
  - `F` → **Finished**
  - `P` in a past week → **Overdue**
  - `P` in the current or a future week → **Remaining**
- New columns added to the sheet appear in the PM Schedule grid automatically —
  column types (text / number / percent / date / boolean / week) are auto-detected.

## Pages

| Page | Description |
|---|---|
| **Dashboard** | KPI tiles, status donut, monthly stacked bars, completion trend, category / site / duty-cycle distributions, weekly calendar heatmap. Every chart and KPI tile is clickable and toggles the shared global filter. |
| **PM Schedule** | AG Grid Community: quick search, per-column + floating filters, sorting, pagination, resize/reorder/hide/show (persisted to localStorage), row selection, CSV export, auto-size. Rows are tinted by derived status. |
| **Settings** | Auto-refresh, interval, theme, export preferences. |
| **About** | Data source and status-derivation rules. |

## Stack

Next.js 15 (App Router) · TypeScript (strict, no `any`) · Tailwind CSS · AG Grid Community ·
Recharts · TanStack Query · Framer Motion · Lucide · next-themes · PapaParse
