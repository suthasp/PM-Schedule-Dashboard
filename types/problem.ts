/** Detected shape of one Problem-sheet column. */
export type ProblemColumnKind = "text" | "number" | "date" | "link";

export interface ProblemColumnMeta {
  /** Raw CSV header (may span multiple lines) — the key into ProblemRow.values. */
  header: string;
  /** Display label: first line of the header. */
  label: string;
  kind: ProblemColumnKind;
}

/** One problem record, kept schema-agnostic like TaskRow. */
export interface ProblemRow {
  id: string;
  /** Raw cell values keyed by CSV header — adapts to new columns automatically. */
  values: Record<string, string>;
}

/** Parsed dataset of the published Problem sheet (flat, single header row). */
export interface ProblemData {
  columns: ProblemColumnMeta[];
  rows: ProblemRow[];
}
