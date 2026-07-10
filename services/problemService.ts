import Papa from "papaparse";
import type { ProblemData } from "@/types/problem";
import { transformProblemCsv } from "@/utils/problemTransform";

/**
 * Fetch the published Problem sheet CSV (via the local API proxy) and parse
 * it with PapaParse into the grid dataset.
 */
export async function fetchProblemData(): Promise<ProblemData> {
  const res = await fetch("/api/problem", { cache: "no-store" });
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
