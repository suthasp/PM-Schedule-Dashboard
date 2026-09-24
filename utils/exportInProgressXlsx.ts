import {
  BUDGET_STATUS_CHIPS,
  CRITERIA_CHIPS,
  PROBLEM_SUMMARY,
  RISK_LEVEL_CHIPS,
} from "@/lib/constants";

/** One row of the In Progress Problems report, as displayed. */
export interface InProgressExportRow {
  no: string;
  site: string;
  recordDate: string;
  subCause: string;
  criteria: string;
  scope: string;
  description: string;
  planDate: string;
  workStatus: string;
  /** Raw BOQ amount so Excel keeps it numeric (null when blank). */
  boqValue: number | null;
  referenceCode: string;
  budgetStatus: string;
  riskLevel: string;
  riskImpact: string;
  remark: string;
}

/** Header, Excel column width (characters) and cell value, in report order. */
const SHEET_COLUMNS: {
  header: string;
  width: number;
  value: (r: InProgressExportRow) => string | number | null;
}[] = [
  {
    header: "No.",
    width: 6,
    value: (r) => (r.no !== "" && !Number.isNaN(Number(r.no)) ? Number(r.no) : r.no),
  },
  { header: "CN Site", width: 11, value: (r) => r.site },
  { header: "วันที่ลงบันทึก", width: 13, value: (r) => r.recordDate },
  { header: "Sub Cause", width: 22, value: (r) => r.subCause },
  { header: "Criteria", width: 10, value: (r) => r.criteria },
  { header: "In/Out Scope", width: 11, value: (r) => r.scope },
  { header: "Description รายละเอียดของปัญหาที่พบ", width: 50, value: (r) => r.description },
  { header: "Plan Date", width: 13, value: (r) => r.planDate },
  { header: "Work Status", width: 13, value: (r) => r.workStatus },
  { header: "BOQ Amount (Baht)", width: 16, value: (r) => r.boqValue },
  { header: "Record Reference Code", width: 16, value: (r) => r.referenceCode },
  { header: "Status Budget", width: 22, value: (r) => r.budgetStatus },
  { header: "Risk Level", width: 11, value: (r) => r.riskLevel },
  { header: "Risk Impact", width: 50, value: (r) => r.riskImpact },
  { header: "Remark", width: 50, value: (r) => r.remark },
];

/** "#0d366b" → "FF0D366B", the ARGB form Excel styles expect. */
const argb = (hex: string): string => `FF${hex.replace("#", "").toUpperCase()}`;

function scopeFill(scope: string): string | null {
  const key = /^in\s*\(\s*amc/i.test(scope)
    ? "scopeAmc"
    : /^in\s*\(\s*r/i.test(scope)
      ? "scopeR"
      : /^in$/i.test(scope)
        ? "scopeIn"
        : /^out/i.test(scope)
          ? "scopeOut"
          : null;
  return key ? PROBLEM_SUMMARY[key].bg.light : null;
}

/**
 * Build a styled .xlsx of the In Progress Problems report and download it.
 * ExcelJS is imported on demand so it only loads when someone exports.
 */
export async function exportInProgressXlsx(
  rows: InProgressExportRow[],
  fileName: string,
): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  book.created = new Date();
  const sheet = book.addWorksheet("In Progress Problems", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = SHEET_COLUMNS.map((c) => ({ header: c.header, width: c.width }));
  const header = sheet.getRow(1);
  header.height = 32;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: argb(PROBLEM_SUMMARY.reportHeader.fg) } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(PROBLEM_SUMMARY.reportHeader.bg) },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  for (const r of rows) {
    const row = sheet.addRow(SHEET_COLUMNS.map((c) => c.value(r)));
    row.alignment = { vertical: "top", wrapText: true };

    row.getCell(10).numFmt = "#,##0.00";

    const criteria = CRITERIA_CHIPS[r.criteria.toUpperCase()];
    if (criteria) row.getCell(5).font = { bold: true, color: { argb: argb(criteria.bg) } };

    const scope = scopeFill(r.scope);
    if (scope) {
      row.getCell(6).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(scope) } };
    }

    row.getCell(9).font = { bold: true, color: { argb: argb(PROBLEM_SUMMARY.inProgress.bg) } };

    const budget = BUDGET_STATUS_CHIPS.find((c) => c.pattern.test(r.budgetStatus));
    if (budget && r.budgetStatus !== "") {
      const cell = row.getCell(12);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(budget.bg) } };
      cell.font = { bold: true, color: { argb: argb(budget.fg) } };
    }

    const risk = RISK_LEVEL_CHIPS[r.riskLevel.trim().toUpperCase()];
    if (risk) {
      const cell = row.getCell(13);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(risk.bg) } };
      cell.font = { bold: true, color: { argb: argb(risk.fg) } };
    }

    for (const col of [1, 2, 3, 5, 6, 8, 9, 11, 12, 13]) {
      row.getCell(col).alignment = { horizontal: "center", vertical: "top", wrapText: true };
    }
  }

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: SHEET_COLUMNS.length } };

  const buffer = await book.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
