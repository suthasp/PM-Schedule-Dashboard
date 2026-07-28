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
