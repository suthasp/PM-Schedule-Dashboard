import type { ProblemData } from "@/types/problem";

export interface PenaltyFields {
  ticketId: string | null;
  ownerGroup: string | null;
  penaltyBaht: string | null;
  penaltyFlag: string | null;
  /** Column W — the activity-level SLA, not the ticket-level TICKET_SLA. */
  activitySla: string | null;
  subCause: string | null;
  creationDate: string | null;
  severity: string | null;
}

export function resolvePenaltyFields(data: ProblemData): PenaltyFields {
  const find = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const hit = data.columns.find((c) => pattern.test(c.label));
      if (hit) return hit.header;
    }
    return null;
  };
  return {
    ticketId: find([/^ticketid$/i]),
    ownerGroup: find([/^trueownergroup$/i]),
    penaltyBaht: find([/^penaltybaht/i]),
    penaltyFlag: find([/^penalty_flag$/i]),
    activitySla: find([/^activity_sla$/i]),
    subCause: find([/^sub_cause$/i]),
    creationDate: find([/^creationdate$/i]),
    severity: find([/^truseverity_desc$/i, /severity/i]),
  };
}

/** "TRUE-TH-WW-CN-SNK" → "CN-SNK". */
export function shortSite(raw: string): string {
  return raw.replace(/^TRUE-TH-WW-/i, "").trim() || raw;
}

export const THAI_MONTHS_ABBR = [
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
] as const;

/** "2026-05-02 0:41:30" → { sortKey: 202605, label: "พ.ค." }, or null. */
export function parseCreationMonth(raw: string): { sortKey: number; label: string } | null {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(raw.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { sortKey: year * 12 + month, label: THAI_MONTHS_ABBR[month - 1] ?? m[2] ?? "" };
}
