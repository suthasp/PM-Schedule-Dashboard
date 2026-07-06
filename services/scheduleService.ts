import Papa from "papaparse";
import type { ScheduleData } from "@/types/schedule";
import { transformCsv } from "@/utils/transform";

/**
 * Fetch the published CSV (via the local API proxy) and parse it with
 * PapaParse into the derived dashboard dataset.
 */
export async function fetchScheduleData(): Promise<ScheduleData> {
  const res = await fetch("/api/schedule", { cache: "no-store" });
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
