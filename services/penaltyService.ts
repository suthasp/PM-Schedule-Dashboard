import Papa from "papaparse";
import type { ProblemData } from "@/types/problem";
import { transformProblemCsv } from "@/utils/problemTransform";

/**
 * Fetch the published Tickets Penalty sheet CSV (via the local API proxy).
 * The sheet is flat single-header-row like the Problem sheet, so it shares
 * that pipeline's transform and grid dataset shape.
 */
export async function fetchPenaltyData(): Promise<ProblemData> {
  const res = await fetch("/api/penalty", { cache: "no-store" });
  if (!res.ok) {
    let message = `Data request failed (${res.status}).`;
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
  return transformProblemCsv(parsed.data);
}
