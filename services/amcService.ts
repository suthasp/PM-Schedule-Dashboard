import Papa from "papaparse";
import type { ScheduleData } from "@/types/schedule";
import { transformCsv } from "@/utils/transform";

/**
 * Fetch the published AMC Actual sheet CSV (via the local API proxy).
 * The sheet is a fiscal-year week matrix like the main PM schedule, so it
 * shares that pipeline's transform and grid dataset shape.
 */
export async function fetchAmcData(): Promise<ScheduleData> {
  const res = await fetch("/api/amc", { cache: "no-store" });
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
  return transformCsv(parsed.data);
}
