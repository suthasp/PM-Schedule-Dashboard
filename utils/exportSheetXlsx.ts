import { PROBLEM_SUMMARY } from "@/lib/constants";
import type { ProblemData } from "@/types/problem";

/** "#0d366b" → "FF0D366B", the ARGB form Excel styles expect. */
const argb = (hex: string): string => `FF${hex.replace("#", "").toUpperCase()}`;

/** Column width in characters, from the header and a sample of the values. */
function columnWidth(label: string, values: string[]): number {
  const longest = values.reduce((max, v) => Math.max(max, v.length), label.length);
  return Math.min(Math.max(longest + 2, 10), 46);
}

/**
 * Export any flat sheet dataset as a styled .xlsx: navy header, frozen top
 * row, AutoFilter, numbers kept numeric so Excel can total them. ExcelJS is
 * imported on demand so it only loads when someone exports.
 */
export async function exportSheetXlsx(
  data: ProblemData,
  fileName: string,
  sheetName: string,
): Promise<void> {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  book.created = new Date();
  // Excel rejects / \ ? * [ ] : in a sheet name, and caps it at 31 characters.
  const safeName = sheetName.replace(/[/\\?*[\]:]/g, " ").slice(0, 31) || "Data";
  const sheet = book.addWorksheet(safeName, { views: [{ state: "frozen", ySplit: 1 }] });

  const cols = data.columns;
  sheet.columns = cols.map((c) => ({
    header: c.label,
    width: columnWidth(
      c.label,
      data.rows.slice(0, 200).map((r) => r.values[c.header] ?? ""),
    ),
  }));

  const header = sheet.getRow(1);
  header.height = 30;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: argb(PROBLEM_SUMMARY.reportHeader.fg) } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(PROBLEM_SUMMARY.reportHeader.bg) },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  for (const row of data.rows) {
    const added = sheet.addRow(
      cols.map((c) => {
        const raw = row.values[c.header] ?? "";
        if (c.kind === "number" && raw !== "") {
          const n = Number(raw.replace(/,/g, ""));
          if (Number.isFinite(n)) return n;
        }
        return raw;
      }),
    );
    added.alignment = { vertical: "top", wrapText: false };
  }

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };

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
