import type { ProblemData, ProblemRow } from "@/types/problem";

/** Thai abbreviated months as the sheets write them, in calendar order. */
export const THAI_MONTHS = [
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

/** Split "ก.ค.2024" into its month name and year; null when it is not one. */
export function splitMonthLabel(label: string): { month: string; year: string } | null {
  const m = /^(.+?)(\d{4})$/.exec(label.trim());
  if (!m) return null;
  const month = (m[1] ?? "").trim();
  if (!THAI_MONTHS.includes(month)) return null;
  return { month, year: m[2] ?? "" };
}

/** "ก.ค.2024" → sortable 24295; unparseable text sorts last. */
export function monthOrder(label: string): number {
  const parts = splitMonthLabel(label);
  if (!parts) return Number.MAX_SAFE_INTEGER;
  return Number(parts.year) * 12 + THAI_MONTHS.indexOf(parts.month);
}

/** A year outside this window is a typo in the sheet, not a real record. */
export function plausibleMonth(label: string): boolean {
  const parts = splitMonthLabel(label);
  if (!parts) return false;
  const year = Number(parts.year);
  return year >= 2000 && year <= 2100;
}

/**
 * The seven dimensions the pages can be narrowed by. An empty list means All;
 * the multi-select dimensions may hold several values at once.
 */
export interface AirconFilters {
  year: string[];
  month: string[];
  airType: string[];
  round: string[];
  contractor: string[];
  region: string[];
  site: string[];
}

export const EMPTY_AIRCON_FILTERS: AirconFilters = {
  year: [],
  month: [],
  airType: [],
  round: [],
  contractor: [],
  region: [],
  site: [],
};

export interface AirconField {
  key: keyof AirconFilters;
  label: string;
  /** This row's value for the dimension ("" when the sheet lacks it). */
  get: (row: ProblemRow) => string;
  /** Calendar order for months, count-then-name elsewhere. */
  sort: "month" | "desc" | "text";
  /** Several values can be ticked at once. */
  multi: boolean;
}

/**
 * Resolve the filterable dimensions this sheet actually has, by column label.
 * The Corrective sheet has no "PM ครั้งที่", so that dropdown is simply absent.
 */
export function resolveAirconFields(data: ProblemData): AirconField[] {
  const find = (pattern: RegExp): string | null =>
    data.columns.find((c) => pattern.test(c.label))?.header ?? null;

  const monthHeader = find(/^month$/i);
  const read = (header: string | null) => (row: ProblemRow) =>
    header === null ? "" : (row.values[header] ?? "").trim();

  const fields: AirconField[] = [];

  if (monthHeader !== null) {
    fields.push({
      key: "year",
      label: "Year",
      get: (row) => splitMonthLabel(row.values[monthHeader] ?? "")?.year ?? "",
      sort: "desc",
      multi: false,
    });
    fields.push({
      key: "month",
      label: "Month",
      get: (row) => splitMonthLabel(row.values[monthHeader] ?? "")?.month ?? "",
      sort: "month",
      multi: true,
    });
  }

  const pairs: [keyof AirconFilters, string, RegExp, boolean][] = [
    ["airType", "ชนิดแอร์", /^แอร์ชนิด$/, false],
    ["round", "PM ครั้งที่", /ครั้งที่/, true],
    ["contractor", "Sub Contractor", /^sub\s*contractor$/i, false],
    ["region", "Region", /^region$/i, true],
    ["site", "Site", /^site$/i, true],
  ];
  for (const [key, label, pattern, multi] of pairs) {
    const header = find(pattern);
    if (header !== null) fields.push({ key, label, get: read(header), sort: "text", multi });
  }
  return fields;
}

function sortValues(values: string[], sort: AirconField["sort"]): string[] {
  if (sort === "month") {
    return [...values].sort((a, b) => THAI_MONTHS.indexOf(a) - THAI_MONTHS.indexOf(b));
  }
  if (sort === "desc") return [...values].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** Rows passing every active filter, optionally ignoring one dimension. */
function matching(
  data: ProblemData,
  fields: AirconField[],
  filters: AirconFilters,
  except?: keyof AirconFilters,
): ProblemRow[] {
  const active = fields.filter((f) => f.key !== except && filters[f.key].length > 0);
  if (active.length === 0) return data.rows;
  return data.rows.filter((row) => active.every((f) => filters[f.key].includes(f.get(row))));
}

/**
 * Options for one dropdown, faceted: only values still reachable given the
 * other dropdowns, so no combination can select an empty table.
 */
export function facetOptions(
  data: ProblemData,
  fields: AirconField[],
  filters: AirconFilters,
  field: AirconField,
): string[] {
  const set = new Set<string>();
  for (const row of matching(data, fields, filters, field.key)) {
    const v = field.get(row);
    if (v !== "") set.add(v);
  }
  // Keep chosen values listed even if other filters have since excluded them,
  // so a ticked box never vanishes from its own dropdown.
  for (const chosen of filters[field.key]) set.add(chosen);
  return sortValues([...set], field.sort);
}

/** The dataset narrowed by every active dropdown. */
export function applyAirconFilters(
  data: ProblemData,
  fields: AirconField[],
  filters: AirconFilters,
): ProblemData {
  if (fields.every((f) => filters[f.key].length === 0)) return data;
  return { ...data, rows: matching(data, fields, filters) };
}
