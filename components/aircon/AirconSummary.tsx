"use client";

import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import { ChartCard } from "@/components/ui/ChartCard";
import { useChartTheme } from "@/hooks/useChartTheme";
import { CATEGORICAL, PENALTY_SUMMARY, SITE_COMPLETION } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";
import { formatNumber } from "@/utils/format";
import { parseDmyMs } from "@/utils/problemTransform";

/** Thai abbreviated months as the sheets write them, in calendar order. */
const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** "ก.ค.2024" → sortable 202406; unparseable text sorts last. */
function monthOrder(label: string): number {
  const m = /^(.+?)(\d{4})$/.exec(label.trim());
  if (!m) return Number.MAX_SAFE_INTEGER;
  const idx = THAI_MONTHS.indexOf((m[1] ?? "").trim());
  if (idx === -1) return Number.MAX_SAFE_INTEGER;
  return Number(m[2]) * 12 + idx;
}

/** A year outside this window is a typo in the sheet, not a real record. */
function plausibleMonth(label: string): boolean {
  const m = /^(.+?)(\d{4})$/.exec(label.trim());
  if (!m) return false;
  const year = Number(m[2]);
  return year >= 2000 && year <= 2100;
}

interface Tally {
  key: string;
  count: number;
}

/** Count rows per distinct value of one column, biggest first. */
function tally(data: ProblemData, header: string | null): Tally[] {
  if (header === null) return [];
  const map = new Map<string, number>();
  for (const row of data.rows) {
    const key = (row.values[header] ?? "").trim() || "(ไม่ระบุ)";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function distinct(data: ProblemData, header: string | null): number {
  if (header === null) return 0;
  const set = new Set<string>();
  for (const row of data.rows) {
    const v = (row.values[header] ?? "").trim();
    if (v && v !== "-") set.add(v);
  }
  return set.size;
}

interface AirconFields {
  site: string | null;
  contractor: string | null;
  month: string | null;
  region: string | null;
  brand: string | null;
  airType: string | null;
  pac: string | null;
  workDate: string | null;
  sparePart: string | null;
}

function resolveFields(data: ProblemData): AirconFields {
  const find = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const hit = data.columns.find((c) => pattern.test(c.label));
      if (hit) return hit.header;
    }
    return null;
  };
  return {
    site: find([/^site$/i]),
    contractor: find([/^sub\s*contractor$/i]),
    month: find([/^month$/i]),
    region: find([/^region$/i]),
    brand: find([/ยี่ห้อ/]),
    airType: find([/^แอร์ชนิด$/]),
    pac: find([/^pac\s*name/i]),
    workDate: find([/^วันที่ทำ/]),
    sparePart: find([/^spare\s*part/i]),
  };
}

/** Earliest and latest work date in the sheet, as d/M/yyyy strings. */
function dateRange(data: ProblemData, header: string | null): string {
  if (header === null) return "—";
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const row of data.rows) {
    const ms = parseDmyMs(row.values[header] ?? "");
    if (ms === null) continue;
    if (ms < min) min = ms;
    if (ms > max) max = ms;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return "—";
  const fmt = (ms: number): string => {
    const d = new Date(ms);
    return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
  };
  return `${fmt(min)} – ${fmt(max)}`;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }): ReactNode {
  return (
    <div className="card p-4">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="text-muted mt-0.5 text-xs">{sub}</p> : null}
    </div>
  );
}

const hairline = { borderColor: "var(--hairline)" } as const;

/** Ranked list of one dimension, with a share-of-total bar behind each row. */
function RankTable({
  label,
  rows,
  total,
  max = 10,
}: {
  label: string;
  rows: Tally[];
  total: number;
  max?: number;
}): ReactNode {
  if (rows.length === 0) {
    return <p className="text-muted py-6 text-center text-sm">No data in this sheet.</p>;
  }
  const shown = rows.slice(0, max);
  const rest = rows.slice(max).reduce((s, r) => s + r.count, 0);
  const headerCell = "whitespace-nowrap border px-2 py-1.5 text-xs font-bold";
  return (
    <div className="max-h-[330px] overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr
            style={{ backgroundColor: SITE_COMPLETION.header.bg, color: SITE_COMPLETION.header.fg }}
          >
            <th className={`${headerCell} text-left`} style={hairline}>
              {label}
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              จำนวน
            </th>
            <th className={`${headerCell} text-right`} style={hairline}>
              สัดส่วน
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.key}>
              <td className="border px-2 py-1" style={hairline}>
                {r.key}
              </td>
              <td className="border px-2 py-1 text-right tabular-nums" style={hairline}>
                {formatNumber(r.count)}
              </td>
              <td className="border px-2 py-1 text-right tabular-nums" style={hairline}>
                {total === 0 ? "0.0%" : `${((r.count / total) * 100).toFixed(1)}%`}
              </td>
            </tr>
          ))}
          {rest > 0 && (
            <tr>
              <td className="text-muted border px-2 py-1 italic" style={hairline}>
                อื่นๆ ({formatNumber(rows.length - max)} รายการ)
              </td>
              <td className="border px-2 py-1 text-right tabular-nums" style={hairline}>
                {formatNumber(rest)}
              </td>
              <td className="border px-2 py-1 text-right tabular-nums" style={hairline}>
                {total === 0 ? "0.0%" : `${((rest / total) * 100).toFixed(1)}%`}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface AirconSummaryProps {
  data: ProblemData;
  /** "PM" for the Preventive sheet, "CM" for Corrective — wording only. */
  kind: "PM" | "CM";
}

/** Executive summary above the Air Condition grids: volume, trend and mix. */
export function AirconSummary({ data, kind }: AirconSummaryProps): ReactNode {
  const theme = useChartTheme();

  const s = useMemo(() => {
    const f = resolveFields(data);
    const months = tally(data, f.month)
      .filter((m) => plausibleMonth(m.key))
      .sort((a, b) => monthOrder(a.key) - monthOrder(b.key));
    const oddMonths = tally(data, f.month).filter((m) => !plausibleMonth(m.key));
    return {
      fields: f,
      total: data.rows.length,
      sites: distinct(data, f.site),
      units: distinct(data, f.pac),
      contractors: distinct(data, f.contractor),
      range: dateRange(data, f.workDate),
      months,
      oddMonths,
      byRegion: tally(data, f.region),
      bySite: tally(data, f.site),
      byContractor: tally(data, f.contractor),
      byBrand: tally(data, f.brand),
      byAirType: tally(data, f.airType),
      bySpare: tally(data, f.sparePart),
    };
  }, [data]);

  const jobWord = kind === "PM" ? "งาน PM" : "งาน CM";
  const pieColors = CATEGORICAL[theme.dark ? "dark" : "light"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Tile label={`จำนวน${jobWord}`} value={formatNumber(s.total)} sub="records in view" />
        <Tile label="Site" value={formatNumber(s.sites)} sub="ไซต์ที่พบ" />
        <Tile label="เครื่องปรับอากาศ" value={formatNumber(s.units)} sub="PAC ที่พบ" />
        <Tile label="Sub Contractor" value={formatNumber(s.contractors)} sub="ผู้รับเหมา" />
        <Tile label="ช่วงวันที่" value={s.range} sub={`วันที่ทำ ${kind}`} />
      </div>

      {s.months.length > 0 && (
        <ChartCard title={`${jobWord} รายเดือน`} subtitle="จำนวนรายการตามเดือนที่บันทึก">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={s.months}
                margin={{ top: 18, right: 8, left: -18, bottom: 0 }}
                barCategoryGap="22%"
              >
                <CartesianGrid vertical={false} stroke={theme.ink.grid} />
                <XAxis
                  dataKey="key"
                  tickLine={false}
                  axisLine={{ stroke: theme.ink.grid }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={56}
                  tick={{ fontSize: 10, fill: theme.ink.muted }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: theme.ink.muted }}
                />
                <Tooltip
                  cursor={{ fill: theme.dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.04)" }}
                  content={({ active, payload, label }) =>
                    active && payload && payload.length > 0 ? (
                      <ChartTooltip
                        label={String(label)}
                        rows={payload.map((p) => ({
                          name: String(p.name),
                          value: Number(p.value),
                          color: String(p.color),
                        }))}
                      />
                    ) : null
                  }
                />
                <Bar dataKey="count" name={jobWord} fill={PENALTY_SUMMARY.tickets.bg} radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    style={{ fontSize: 10, fill: theme.ink.muted }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
        <ChartCard title="Site" subtitle={`จำนวน${jobWord} ตามไซต์`}>
          <RankTable label="Site" rows={s.bySite} total={s.total} />
        </ChartCard>
        <ChartCard title="Region" subtitle={`จำนวน${jobWord} ตามภูมิภาค`}>
          <RankTable label="Region" rows={s.byRegion} total={s.total} />
        </ChartCard>
        <ChartCard title="Sub Contractor" subtitle={`จำนวน${jobWord} ตามผู้รับเหมา`}>
          <RankTable label="Sub Contractor" rows={s.byContractor} total={s.total} />
        </ChartCard>
        <ChartCard title="ยี่ห้อเครื่องปรับอากาศ" subtitle={`จำนวน${jobWord} ตามยี่ห้อ`}>
          <RankTable label="ยี่ห้อ" rows={s.byBrand} total={s.total} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-2">
        {s.byAirType.length > 0 && (
          <ChartCard title="ชนิดแอร์" subtitle="Precision Air vs Comfort Air">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={s.byAirType}
                    dataKey="count"
                    nameKey="key"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {s.byAirType.map((entry, i) => (
                      <Cell key={entry.key} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload && payload.length > 0 ? (
                        <ChartTooltip
                          rows={payload.map((p) => ({
                            name: String(p.name),
                            value: Number(p.value),
                            color: String(p.payload?.fill ?? ""),
                          }))}
                        />
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
              {s.byAirType.map((entry, i) => (
                <li key={entry.key} className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: pieColors[i % pieColors.length] }}
                    aria-hidden
                  />
                  <span className="text-secondary">
                    {entry.key} {formatNumber(entry.count)}
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>
        )}
        {s.bySpare.length > 0 && (
          <ChartCard title="Spare Part" subtitle="สัดส่วนงานที่ต้องเปลี่ยนอะไหล่">
            <RankTable label="Spare Part" rows={s.bySpare} total={s.total} max={6} />
          </ChartCard>
        )}
      </div>

      {s.oddMonths.length > 0 && (
        <p className="text-muted text-xs">
          * ไม่นับรวมในกราฟรายเดือน {s.oddMonths.length} ค่าที่ปีผิดปกติ:{" "}
          {s.oddMonths.map((m) => `${m.key} (${m.count})`).join(", ")}
        </p>
      )}
    </div>
  );
}
