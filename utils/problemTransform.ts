import type {
  ProblemColumnKind,
  ProblemColumnMeta,
  ProblemData,
  ProblemRow,
} from "@/types/problem";

/** Parse a Thai-style d/M/yyyy cell into UTC epoch ms (null if not one). */
export function parseDmyMs(raw: string): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return Date.UTC(year, month - 1, day);
}

function detectKind(samples: string[]): ProblemColumnKind {
  const filled = samples.map((s) => s.trim()).filter((s) => s !== "");
  if (filled.length === 0) return "text";
  // Attachment columns mix URLs with the odd plain filename — majority of URLs wins.
  if (filled.filter((s) => /^https?:\/\//i.test(s)).length > filled.length / 2) return "link";
  if (filled.every((s) => parseDmyMs(s) !== null)) return "date";
  if (filled.every((s) => /^-?[\d,]+(\.\d+)?$/.test(s))) return "number";
  return "text";
}

/**
 * Turn the published Problem sheet CSV into a grid-ready dataset. Unlike the
 * PM schedule this sheet is flat: one header row (cells may contain embedded
 * newlines with editing hints), one problem per data row. Schema-agnostic —
 * new sheet columns show up without code changes.
 */
export function transformProblemCsv(rows: string[][]): ProblemData {
  if (rows.length < 1) {
    throw new Error("The published problem sheet returned no header row.");
  }
  const headerRow = (rows[0] ?? []).map((h) => h.trim());

  // Column index per named header (first occurrence wins); unnamed columns are dropped.
  const headerIndex = new Map<string, number>();
  headerRow.forEach((h, i) => {
    if (h && !headerIndex.has(h)) headerIndex.set(h, i);
  });
  const headers = [...headerIndex.keys()];

  const dataRows = rows.slice(1).filter((r) => r.some((c) => c && c.trim() !== ""));

  const problemRows: ProblemRow[] = dataRows.map((row, i) => {
    const values: Record<string, string> = {};
    headers.forEach((h) => {
      const idx = headerIndex.get(h);
      values[h] = idx !== undefined ? (row[idx] ?? "").trim() : "";
    });
    return { id: `problem-${i}`, values };
  });

  const columns: ProblemColumnMeta[] = headers.map((header) => {
    const samples = problemRows.slice(0, 60).map((r) => r.values[header] ?? "");
    return {
      header,
      label: header.split("\n")[0]?.trim() || header,
      kind: detectKind(samples),
    };
  });

  return { columns, rows: problemRows };
}
