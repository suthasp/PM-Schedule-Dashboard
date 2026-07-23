# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Next.js dev server at http://localhost:3000
npm run build    # Production build (also the de-facto type check)
npm run lint     # ESLint (next lint)
npm run format   # Prettier over the whole repo
```

There is no test suite. TypeScript is strict and the codebase avoids `any`. Imports use the `@/` path alias to the repo root.

## What this app is

Executive dashboard for preventive-maintenance (PM) scheduling, driven live from a **published Google Sheet CSV** (fiscal-year matrix: one PM task per row, one `WK##` column per week). There is no database — all state is derived client-side from that CSV on every fetch.

There is a second, simpler data source: the **Problem sheet** (`PROBLEM_CSV_URL`), a flat single-header-row issue tracker shown as an AG Grid on `/problem`. It has its own parallel pipeline (`app/api/problem/route.ts` → `services/problemService.ts` → `utils/problemTransform.ts` → `hooks/useProblemData.ts` → `components/grid/ProblemGridTable.tsx`) and does not participate in the global dimension filters — only the header search (grid quick filter). The `/problem` page adds its own local filters (site / scope / status) plus summary cards on top of the grid.

A third source, the **Data Tracking sheet** (`TRACKING_CSV_URL`, `/tracking`), is flat like the Problem sheet and **reuses that pipeline**: `transformProblemCsv` for parsing and `ProblemGridTable` for display (parameterised by `storageKeyBase` / `itemLabel`). Any new flat sheet should follow the same route.

A fourth source, the **Tickets Penalty sheet** (`PENALTY_CSV_URL`, `/penalty`), is a large flat SLA/penalty ticket log (32 columns) — same reused pipeline, plus `components/penalty/PenaltySummary.tsx` (KPI tiles, per-site penalty table, top causes, SLA donut) and `ProblemGridTable`'s `autoSizeOnLoad` prop, since a curated column-width list isn't practical at that width.

A fifth source, the **Pending Ticket sheet** (`PENDING_CSV_URL`, `/pending`), is a small flat open-ticket log (23 columns) — same reused pipeline, grid-only (no summary dashboard).

## Data pipeline (the big picture)

1. **`lib/constants.ts`** holds `CSV_URL` (the published Google Sheet). Change the data source here.
2. **`app/api/schedule/route.ts`** is a thin server-side proxy (`force-dynamic`, no-store) that exists only to dodge CORS; everything else is client-side.
3. **`services/scheduleService.ts`** fetches the proxy and parses CSV with PapaParse.
4. **`utils/transform.ts` — the core of the app.** `transformCsv(rows, now)` turns raw CSV into `ScheduleData` (`types/schedule.ts`):
   - The sheet's first two rows are headers: a forward-filled month row and a `WK##` week row. `buildWeeks` maps them onto a fiscal-year timeline (e.g. WK27 July → WK26 June) anchored to real ISO-week Mondays, so **derived status depends on today's date**.
   - Each non-empty week cell becomes one `PMJob`: mark in `FINISHED_MARKS` (`F`, `DONE`, `C`, `OK`) → **Finished**; otherwise past week → **Overdue**, current/future week → **Remaining**. A task's rollup status is Overdue > Remaining > Finished.
   - **Schema-agnostic:** non-week columns are not hardcoded. Well-known dimensions (category, work instruction, duty cycle, site) are resolved by regex against headers (`findHeader`); column types for the grid are auto-detected (`detectKind`). New sheet columns appear automatically — preserve this property when editing.
5. **`hooks/useScheduleData.ts`** wraps the fetch in TanStack Query with an auto-refresh interval from Settings (default 5 min).
6. **`components/providers/FilterProvider.tsx`** is a single global `Filters` state shared by the Dashboard and the PM Schedule grid — clicking any chart segment, KPI tile, or site bar calls `toggleFilter` and filters both pages. Filter matching lives in `utils/transform.ts` (`jobMatchesFilters`, `taskMatchesFilters`); `hooks/useFilteredData.ts` applies it.

Provider nesting (in `app/providers.tsx`): ThemeProvider → QueryClientProvider → SettingsProvider → FilterProvider.

## Conventions

- **Jobs vs tasks:** a `TaskRow` is one sheet row; a `PMJob` is one scheduled occurrence (one week cell). KPIs and charts count jobs, the grid shows tasks.
- **Status wording:** user-facing terms are **Finished / Remaining / Overdue** (deliberately renamed from Completed/Pending — keep this).
- **Colors are centralized** in `lib/constants.ts` (`STATUS_COLORS`, `STATUS_TINTS`, `STATUS_CHIPS`, `CATEGORICAL`, `SEQUENTIAL_BLUE`, `CHART_INK`) with light/dark variants; charts read theme-aware values through `hooks/useChartTheme.ts`. Don't hardcode chart colors in components.
- **Persistence:** localStorage only, keys under `LS_KEYS` in `lib/constants.ts` (settings, AG Grid column state, sidebar collapse). Bump the key suffix (e.g. `-v2`) when changing a persisted shape.
- Pages: `/` dashboard (Recharts), `/schedule` AG Grid Community table, `/settings`, `/about`. Layout shell in `components/layout/AppShell.tsx`.
