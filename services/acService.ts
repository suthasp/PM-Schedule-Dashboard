import Papa from "papaparse";
import type { ProblemData } from "@/types/problem";
import { transformProblemCsv } from "@/utils/problemTransform";

/**
 * The Preventive sheet names its five trailing geography columns all
 * "Region1". They carry the same values, in the same order, as the Corrective
 * sheet's Region / Location / Region1 / Region2 / Province, so they are
 * renamed to match — otherwise the transform (first header wins) would drop
 * four of them.
 */
const REPEATED_HEADER_NAMES: Record<string, string[]> = {
  Region1: ["Region", "Location", "Region1", "Region2", "Province"],
};

/**
 * Make every header unique so no column is silently dropped. A header known to
 * repeat gets its proper names; anything else repeating is suffixed " (2)",
 * " (3)", … so the data still reaches the grid.
 */
export function uniquifyHeaders(headerRow: string[]): string[] {
  const total = new Map<string, number>();
  for (const raw of headerRow) {
    const h = raw.trim();
    if (h) total.set(h, (total.get(h) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return headerRow.map((raw) => {
    const h = raw.trim();
    if (!h || (total.get(h) ?? 0) < 2) return raw;
    const n = seen.get(h) ?? 0;
    seen.set(h, n + 1);
    const names = REPEATED_HEADER_NAMES[h];
    if (names && names.length === total.get(h)) return names[n] ?? `${h} (${n + 1})`;
    return n === 0 ? h : `${h} (${n + 1})`;
  });
}

async function fetchSheet(path: string, label: string): Promise<ProblemData> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    let message = `${label} request failed (${res.status}).`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body — keep the default message
    }
    throw new Error(message);
  }
  const csvText = await res.text();

  const parsed = Papa.parse<string[]>(csvText, { skipEmptyLines: "greedy" });
  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV parse failed: ${parsed.errors[0]?.message ?? "unknown error"}`);
  }
  const rows = [...parsed.data];
  const head = rows[0];
  if (head) rows[0] = uniquifyHeaders(head);
  return transformProblemCsv(rows);
}

/** Fetch the AMC Air Condition Preventive (PM) sheet via the local proxy. */
export async function fetchAcPreventiveData(): Promise<ProblemData> {
  return fetchSheet("/api/ac-preventive", "Preventive data");
}

/** Fetch the AMC Air Condition Corrective (CM) sheet via the local proxy. */
export async function fetchAcCorrectiveData(): Promise<ProblemData> {
  return fetchSheet("/api/ac-corrective", "Corrective data");
}
